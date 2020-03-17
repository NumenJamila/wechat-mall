var app = getApp();
import _ from '../../../utils/underscore';
import util from '../../../utils/util';
import listener from '../../../utils/listener';
const _DuoguanData = require('../../../utils/data');
import {
  duoguan_host_api_url as API_URL,
  duoguan_get_user_menu_url as API_MENU_URL,
  duoguan_user_info_url as API_USER_INFO_URL,
  duoguan_user_info_post_url as API_USER_INFO_SAVE_URL,
  duoguan_config_version as VERSION
} from "../../../utils/data";
import requestUtil from '../../../utils/requestUtil';

Page({
  data: {
    userInfo: {},
    bbs_show_status: true,
    shop_show_status: true,
    menu_list: '',
    is_loaded: false,
    has_coupon: true,
    is_open_card: false,
    authorize: false,
    authorize_info: {
      phone: '',
      isDisabled: false
    },
    show_qr_code: false,
    heixiao: {
      menus: [
        { name: "hexiao", text: "核销", link: "pages/user/exam/index", icon: "icon-duoguan-hexiao", },
      ],
      type: 'line'
    },
    operating: {
      menus: [
        { name: "Operating", text: "运营中心", link: "pages/user/operate/operate-list/operate-list", icon: "icon-yunyingjiqiao", },
      ],
      type: 'line'
    },
    distribution: {
      menus: [
        { name: "fenxiao", text: "分销", link: "pages/user/fenxiao/index/index", icon: "icon-fenxiao", },
      ],
      type: 'line'
    },
    open_card_info: {
      phone: '', // 开通会员时的手机号
      isDisabled: false,
    },
    open_card_version: '2', // 开通会员的样式版本 1为整体样式的，2为获取微信手机号码即可开通的
  },

  /**
   * 页面加载完成
   */
  onLoad: function () {
    // this.onPullDownRefresh();
    //if (!wx.getStorageSync('is_first_sync_user_info')) {
    //  this.onSyncWechatInfo();
    //  wx.setStorageSync('is_first_sync_user_info', true);
    //}
  },
  onShow:function(){
    // this.loadMemberCard();
    this.onPullDownRefresh();
  },
  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
  },

  /**
   * 下拉刷新
   */
  onPullDownRefresh: function () {
    //加载用户信息
    requestUtil.get(API_USER_INFO_URL, {}, (data) => {
      const userInfo = _.extend(this.data.userInfo || {}, data);
      this.setData({ userInfo: userInfo });
    }, this, { completeAfter: wx.stopPullDownRefresh });

    //加载菜单信息
    requestUtil.get(API_URL +"/index.php/addon/DuoguanUser/Api/getMiniUserMenuList.html", { ver_id: 29512, fx_version: 395 }, (data, res) => {
      data.push({
        menus: [
          { name: "settings", text: "设置", link: "pages/user/setting/index", icon: "icon-xitongshezhi", },
        ],
        type: 'line'
      });

      this.setData({
        menus: data,
        is_loaded: true,
        is_open_card: res.is_open_card == 1,
        is_open_wallet: res.is_open_wallet == 1,
        is_open_coupon: res.is_open_coupon == 1,
        is_open_score: res.is_open_score == 1,
        is_open_locus: res.is_open_locus == 1,
      });

      //加载会员卡
      this.loadMemberCard();
    });
    this.checkServiceStatus();
    this.getOtherConfig();
  },

  /**
   * 加载会员卡信息
   */
  loadMemberCard: function () {
    requestUtil.get(API_URL + "/index.php?s=/addon/DuoguanUser/CardApi/getInfo.html", {}, (info) => {
      info.show = false;
      this.setData({ card_info: info });
    }, this, { isShowLoading: false });
  },

  /**
   * 跳转页面
   */
  onNavigateTap: function (e) {
    const dataset = e.currentTarget.dataset, url = dataset.url, name = dataset.name;
    if ("wechat_address" == name) {
      wx.chooseAddress({});
    } else if ("wechat_setting" == name) {
      wx.openSetting({});
    } else if ("wechat_clear" == name) {
      wx.showToast({ title: '正在清理中...', icon: 'loading', duration: 10 });
      wx.clearStorageSync();
      wx.showToast({ title: '清理完成', icon: 'success', duration: 1500 });
    } else if ('wechat_info_sync' == name) {
      this.onSyncWechatInfo();
    } else {
      wx.navigateTo({
        url: url,
        fail: function (res) {
          wx.switchTab({
            url: url,
          });
        }
      });
    }
  },

	/**
	 * 打开联系我们
	 */
  onCompanyTap: function (e) {
    const userInfo = this.data.userInfo;
    if (!userInfo || userInfo.is_tel_on != 1) return;
    wx.navigateTo({ url: '../company/index' });
  },

  /**
   * 同步微信信息
   */
  onSyncWechatInfo: function () {
    if (requestUtil.isLoading(this.syncWechatInfoId)) return;
    util.getUserInfo((info) => {
      //保存用户信息
      this.syncWechatInfoId = requestUtil.post(API_USER_INFO_SAVE_URL, {
        nickname: info.nickName,
        headimgurl: info.avatarUrl,
        sex: info.gender,
        city: info.city, province: info.province,
        country: info.country, language: info.language,
      }, (data) => {
        console.log(data);
        wx.showToast({
          title: '同步成功！',
          icon: 'success',
          duration: 2000
        });
        const userInfo = _.extend(this.data.userInfo || {}, data);
        this.setData({ userInfo: userInfo });
      });
    });
  },

  /**
   * 展开或收缩
   */
  onToggleTap: function (e) {
    const dataset = e.currentTarget.dataset, name = dataset.name;
    const item = _.find(this.data.menus, { name: name });
    if (!item) return;
    item.isshow = !item.isshow;
    this.setData({ menus: this.data.menus });
  },

	/**
	 * 拨打电话
	 */
  onCallPhoneTap: function () {
    wx.makePhoneCall({
      phoneNumber: this.data.userInfo.app_tel,
    });
  },

  /**
   * 获取手机号码
   */
  // onGetPhoneNumber: function (e) {
  //   let that = this;
  //   if (!e.detail.encryptedData) {
  //     if (this.data.open_card_version == '2') {
  //       util.userMobile("bind", function (res) {
  //         let open_card_info = that.data.open_card_info;
  //         open_card_info.isDisabled = true;
  //         if (res.mobile) {
  //           that.phone = res.mobile;
  //           open_card_info.phone = res.mobile;
  //           that.setData({
  //             open_card_info: open_card_info,
  //           });
  //           that.onOpenTap();
  //         } else {
  //           // 获取手机号失败
  //           that.setData({
  //             open_card_info: open_card_info,
  //           });
  //         }
  //       });
  //     }
  //     return;
  //   }

  //   const handler = () => {
  //     const url = API_URL + '/index.php?s=/addon/DuoguanUser/CardApi/openCardByWxPhone.html';
  //     requestUtil.post(url, {
  //       encryptedData: e.detail.encryptedData,
  //       iv: e.detail.iv,
  //       name: this.card_name || '',
  //       ver: '0.0.1',
  //       is_open_card: 'no', // 兼容参数
  //     }, (info) => {

  //     }, this, {
  //         isShowLoading: true, loadingText: '获取中', completeAfter: function (res) {
  //           // 兼容处理 此次为兼容支付宝小程序
  //           let info = res.data.data;

  //           let open_card_info = this.data.open_card_info;
  //           open_card_info['phone'] = info['open_card_status'] == 'no' ? info['phone'] : open_card_info['phone'];
  //           open_card_info['isDisabled'] = this.data.open_card_version == "2" ? true : false;

  //           this.phone = open_card_info['phone']; // 兼容处理onInputValue方法

  //           this.setData({
  //             open_card_info: open_card_info,
  //           });

  //           if (this.data.open_card_version == '2') {
  //             this.onOpenTap();
  //           }
  //         }
  //       });
  //   };
  //   handler();
  // },


  /**
   * 设置Page data 中的值
   */
  onSetValueTap: function (e) {
    const dataset = e.currentTarget.dataset, name = dataset.name, isMulti = dataset.isMulti || false;
    if (isMulti) {
      let values = JSON.parse(dataset.value);
      if (name) {
        const data = {};
        data[name] = Object.assign(this.data[name], values);
        this.setData(data);
      } else {
        for (let x in values) {
          values[x] = Object.assign(this.data[x] || {}, values[x]);
        }
        this.setData(values);
      }
    } else {
      const value = dataset.value;
      const data = {};
      data[name] = value;
      this.setData(data);
    }
  },


  /**
   * 获取输入的值
   */
  onInputValue: function (e) {
    const value = e.detail.value, name = e.currentTarget.dataset.name;
    this[name] = value;

    let open_card_info = this.data.open_card_info;
    open_card_info[name] = value;
    this.setData({
      open_card_info: open_card_info,
    });
  },

  /**
   * 获取手机验证码
   */
  onGetVerifyCodeTap: function (e) {
    const url = API_URL + '/index.php?s=/addon/DuoguanUser/CardApi/sendPhoneVerifyCode.html';
    requestUtil.post(url, { phone: this.data.open_card_info.phone }, (info) => {
      wx.showToast({ title: '验证码发送成功，请注意查收！', });
      let reload_verify_time = 60;
      const handler = () => {
        if (reload_verify_time > 0) {
          this.setData({
            reload_verify_time: reload_verify_time--
          });
          setTimeout(handler, 1000);
        } else {
          this.setData({
            reload_verify_time: null
          });
        }
      };
      handler();
    });
  },

  /**
   * 开卡操作
   */
  onOpenTap: function () {
    const url = API_URL + '/index.php?s=/addon/DuoguanUser/CardApi/openCard.html';
    requestUtil.post(url, {
      phone: this.phone,
      code: this.verify_code,
      name: this.card_name || '',
      ver: '0.0.1',
      open_card_version: this.data.open_card_version, // 兼容处理
    }, (info) => {
      wx.showToast({ title: '开卡成功！', duration: 2500 });
      const card_info = this.data.card_info;
      card_info.show = false;
      card_info.status = 1;

      this.setData({ card_info: card_info });
    });
  },

  /**
   * 关闭开通会员弹出框（开通会员卡2.0使用）
   */
  closeOpenCardPopUpBox: function (e) {
    let card_info = this.data.card_info;
    card_info.show = false;
    this.setData({
      card_info: card_info,
    });
  },

  /**
   * 输入用户名称（开通会员卡2.0使用）
   */
  inputName: function (e) {
    let value = e.detail.value;
    this.card_name = value;
    let open_card_info = this.data.open_card_info;
    open_card_info.card_name = value;
    open_card_info.isDisabled = value.length >= 2 ? true : false;

    this.setData({
      open_card_info: open_card_info,
    });
  },

  showAuthorize: function () {
    var that = this;
    if (that.data.userInfo.unique_phone == '' || that.data.userInfo.unique_phone == 'undefined') {
      this.setData({ authorize: !this.data.authorize })
    }
  },

  closeAuthorize: function () {
    this.setData({ authorize: false })
  },

  authorizeInputName: function (e) {
    var that = this;
    let value = e.detail.value;
    let authorize_info = that.data.authorize_info;
    authorize_info.name = value;
    authorize_info.isDisabled = value.length >= 2 ? true : false;
    this.setData({
      authorize_info: authorize_info,
    });
  },

  /**
 * 获取手机号码
 */
  onGetPhoneNumber: function (e) {
    let that = this;
    if (!e.detail.encryptedData) {
      return;
    }

    const handler = () => {
      const url = API_URL + '/index.php?s=/addon/DuoguanUser/Api/openCardByWxPhone.html';
      requestUtil.post(url, {
        encryptedData: e.detail.encryptedData,
        iv: e.detail.iv,
      }, (info) => {

      }, this, {
          isShowLoading: true, loadingText: '获取中', completeAfter: function (res) {
            // 兼容处理 此次为兼容支付宝小程序
            let info = res.data.data;

            let authorize_info = this.data.authorize_info;
            authorize_info['phone'] = info['phone'];
            authorize_info['isDisabled'] = false;

            this.phone = authorize_info['phone']; // 兼容处理onInputValue方法

            this.setData({
              authorize_info: authorize_info
            });
            this.keepUserMobile();
          }
        });
    };
    handler();
  },

  keepUserMobile: function () {
    var that = this;
    that.setData({ authorize: false });
    if (that.data.authorize_info.phone == '' || that.data.authorize_info.phone == 'undefined' || that.data.authorize_info.phone == undefined) return;
    requestUtil.get(API_URL + '/index.php?s=/addon/DuoguanUser/Api/keepUserMobile', {
      phone: that.data.authorize_info.phone
    }, (info) => {
      that.onPullDownRefresh();
    }, this, { isShowLoading: true });
  },

  checkServiceStatus: function () {
    var that = this;
    requestUtil.get(API_URL + '/index.php?s=/addon/ServiceCard/Api/checkServiceStatus', {}, (info) => {
      if (info) {
        that.setData({
          service_card_status: true,
          service_card_info: info
        });
      } else {
        that.setData({ service_card_status: false });
      }
    }, this, { isShowLoading: true });
  },

  getOtherConfig: function () {
    var that = this;
    requestUtil.get(API_URL + '/index.php?s=/addon/DuoguanUser/Api/getOtherConfig', {}, (data) => {
      that.setData({
        is_show_sign: data.is_show_sign == true ? true : false
      })
    }, this, { isShowLoading: true });
  },

  onNavigateToAi: function (e) {
    var that = this;
    if (that.data.service_card_status) {
      var url = '/pages/user/businessCard/locus/locus?id=' + that.data.service_card_info.id;
      wx.navigateTo({
        url: url,
      })
    } else {
      wx.showModal({
        title: '提示',
        content: '身份不符合',
        showCancel: false
      })
    }
  },
  //获取小程序二维码
  showQRCode5: function () {
    const that = this;
    const url = API_URL + "/index.php?s=/addon/DuoguanUser/Api/FXIndexCode.html&&token=" + _DuoguanData.duoguan_user_token + "&_r=" + (new Date().getTime()) + "&path=" + _DuoguanData.duoguan_app_index_path;
    wx.showToast({
      title: '正在努力加载中...',
      icon: 'loading',
      duration: 10000
    });
    wx.getImageInfo({
      src: url,
      success: (res) => {
        wx.hideToast();
        console.log('success', res);
        that.setData({ qr_code: res.path });
        // wx.previewImage({
        //   current: res.path,
        //   urls: [res.path],
        // });
      },
      fail: function (res) {
        console.error(res);
        wx.showModal({ content: '加载失败！', showCancel: false, });
        wx.hideToast();
      },
      complete: function (res) {
        console.log(res)
      }
    });
    that.setData({ show_qr_code: !that.data.show_qr_code });
  },
  showQRCode: function () {
    var is_show_sign = this.data.is_show_sign == true ? 1 : 0
    wx.navigateTo({
      url: '../share/index?is_show_sign=' + is_show_sign
    })
  },
  colseQRCode: function () {
    var that = this;
    that.setData({ show_qr_code: !that.data.show_qr_code });
  },
  //保存二维码
  saveimage: function () {
    var that = this
    // 可以通过 wx.getSetting 先查询一下用户是否授权了 "scope.record" 这个 scope
    wx.getSetting({
      success(res) {
        if (!res.authSetting['scope.writePhotosAlbum']) {
          wx.authorize({
            scope: 'scope.writePhotosAlbum',
            success(res) {
              // 用户已经同意小程序使用保存图片到系统相册功能，后续调用 wx.saveImageToPhotosAlbum 接口不会弹窗询问
              wx.saveImageToPhotosAlbum({
                filePath: that.data.qr_code,
                success: function (res) {
                  wx.showModal({
                    title: '提示',
                    content: '保存图片成功',
                    showCancel: false
                  })
                },
                fail: function (res) {
                  wx.showModal({
                    title: '保存图片失败',
                    content: res.errMsg,
                    showCancel: false
                  })
                }
              })
            }
          })
        }
        else {
          wx.saveImageToPhotosAlbum({
            filePath: that.data.qr_code,
            success: function (res) {
              wx.showModal({
                title: '提示',
                content: '保存图片成功',
                showCancel: false
              })
            },
            fail: function (res) {
              wx.showModal({
                title: '保存图片失败',
                content: res.errMsg,
                showCancel: false
              })
            }
          })
        }
      }
    })
  },
});