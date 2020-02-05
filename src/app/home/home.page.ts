import { Component, OnInit } from '@angular/core';
import { UserDataService } from '../services/user-data.service';
import { NavController, AlertController, Platform } from '@ionic/angular';
import { RestDataService } from '../services/rest-data.service';
import { RestaurantDetailsResponse, MenuList } from '../models/RestaurantDetails';
@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit {
subscription;
price = 0;
selectedItems: MenuList[] = [];
APP_NAME;
BRANCH;
detailsResponse: RestaurantDetailsResponse;
displayMenu: any = {};
categories: string[] = [];
searchVisible = false;
veg = false;
vegMenu: any = {};
originalMenu;
originalCategories;
searchVal; // used in html
searchItemText = 'search results';

  constructor(public data: UserDataService,
              private navCtrl: NavController,
              private restServ: RestDataService,
              private alertController: AlertController,
              private platform: Platform) {}

  ngOnInit(): void {
    // Called after the constructor, initializing input properties, and the first call to ngOnChanges.
    // Add 'implements OnInit' to the class.
    this.price = 0;
    this.selectedItems = [];
    this.searchVisible = false;
    this.veg = false;

    this.APP_NAME = this.data.getAppName();
    this.BRANCH = this.data.getSelectedBranch();
    this.restServ.getRestaurantDetails().subscribe(res => {
      console.log(res);
      const result: any = res;
      this.detailsResponse = result;
      const menu = this.detailsResponse.menuList;

      menu.forEach(item => {
        if (!this.displayMenu[item.restaurantMenu.restaurantMenuType]) {
          this.displayMenu[item.restaurantMenu.restaurantMenuType] = [];
        }

        item.count = 0;
        this.displayMenu[item.restaurantMenu.restaurantMenuType].push(item);

        if (item.restaurantMenu.restaurantMenuCategory === 'veg') {

          if (!this.vegMenu[item.restaurantMenu.restaurantMenuType]) {
            this.vegMenu[item.restaurantMenu.restaurantMenuType] = [];
          }

          item.count = 0;
          this.vegMenu[item.restaurantMenu.restaurantMenuType].push(item);
          }
      });

      this.categories = Object.keys(this.displayMenu);
      this.originalCategories = this.categories;
      console.log(this.displayMenu);
      this.originalMenu = this.displayMenu;
    });
  }

  async searchMenu($event) {
    const searchKey = $event.detail.value;

    if (searchKey === '') {
      this.categories = this.originalCategories;
      this.refreshMenu(false);
      return;
    }

    const response: any = await this.restServ.getMenuSearch(searchKey);

    console.log(response);
    const foodToDisplay = {};
    response.forEach(element => {
      const elem: any = element;
      let res: string = elem;

      res = res.split('/')[1];
      foodToDisplay[res] = 1;
    });

    console.log(this.displayMenu);
    this.filterMenu(foodToDisplay);
  }

  filterMenu(food) {

    this.displayMenu = this.originalMenu;
    const results = [];

    this.categories.forEach(element => {
      if (this.displayMenu[element]) {
        this.displayMenu[element].forEach(items => {
          if (food[items.restaurantMenu.restaurantMenuId]) {
            results.push(items);
          }
        });
      }
    });

    this.displayMenu[this.searchItemText] = results;
    this.categories = [this.searchItemText];
    console.log(this.displayMenu);
  }

  async presentAlertRadio() {
    const data = [];
    const branches = this.data.getBranches();
    const curr = this.data.getSelectedBranch();

    branches.forEach(element => {
      const obj = {name: element, type: 'radio', value: element, label: element, checked: false};
      if (element === curr) {
        obj.checked = true;
      }
      data.push(obj);
    });
    const alert = await this.alertController.create({
      header: 'Radio',
      inputs: data,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          cssClass: 'secondary',
          handler: () => {
            console.log('Confirm Cancel');
          }
        }, {
          text: 'Ok',
          handler: (resData) => {
            console.log(resData);
            if (resData !== curr) {
              this.data.setSelectedBranch(resData);
              this.BRANCH = resData;
              this.ngOnInit();
            }
          }
        }
      ]
    });

    await alert.present();
  }

  changeItemCount(item: MenuList, count: number) {
    if (count === -1 && item.count === 0) {
      return;
    }
    item.count += count;
    this.price += item.restaurantMenu.restaurantMenuFinalPrice * count;
  }


  ionViewWillEnter() {
    this.selectedItems = this.data.getCartItems();

    this.categories.forEach(element => {
      if (this.displayMenu[element]) {
        this.displayMenu[element].forEach(items => {
          if (items.count > 0) {
            this.selectedItems.forEach(selectedItem => {
              if (selectedItem.restaurantMenu.restaurantMenuId === items.restaurantMenu.restaurantMenuId) {
                items.count = selectedItem.count;
              }
            });
          }
        });
      }
    });

    this.price = 0;
    if (this.selectedItems) {
      this.selectedItems.forEach(element => {
        this.price += element.count * element.restaurantMenu.restaurantMenuFinalPrice;
      });
    }
  }

  goToCart() {
    this.selectedItems = [];
    this.categories.forEach(element => {
      if (this.displayMenu[element]) {
        this.displayMenu[element].forEach(items => {
          if (items.count > 0) {
            this.selectedItems.push(items);
          }
        });
      }
    });

    this.data.setCartItems(this.selectedItems);
    this.navCtrl.navigateForward('cart');
  }
  toggleSearch() {
    this.searchVisible = !this.searchVisible;
    if (!this.searchVisible) {
      this.categories = this.originalCategories;
      this.refreshMenu(false);
    } else {
      this.searchVal = '';
    }
  }

  toggleVeg() {
    this.veg = !this.veg;
    this.refreshMenu(true);
  }

  refreshMenu(resetCount: boolean) {
    // do something
    const currentMenu = this.displayMenu;

    if (this.veg) {
      this.displayMenu = this.vegMenu;
    } else {
      this.displayMenu = this.originalMenu;
    }
    if (resetCount) {
      this.selectedItems = [];
    }
    this.price = 0;

    this.categories.forEach(element => {
      if (this.displayMenu[element]) {
        this.displayMenu[element].forEach(items => {

          if (resetCount) {
            items.count = 0;
            return;
          }

          if (currentMenu[this.searchItemText]) {
            currentMenu[this.searchItemText].forEach(elem => {
              if (elem.restaurantMenu.restaurantMenuId === items.restaurantMenu.restaurantMenuId) {
                items.count = elem.count;
              }
            });
          }
        });
      }
    });
    console.log(this.displayMenu);
  }

  ionViewDidEnter() {
    this.subscription = this.platform.backButton.subscribe(() => {
        const app = 'app';
        navigator[app].exitApp();
    });
  }

  ionViewWillLeave() {
    this.subscription.unsubscribe();
  }

  logOut() {
    this.data.logout();
    this.navCtrl.navigateRoot('authentication');
  }
}
