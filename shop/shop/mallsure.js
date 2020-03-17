const app = getApp();
const requestUtil = require('../../../utils/requestUtil');
const _DuoguanData = require('../../../utils/data');
const util = require('../../../utils/util');
const listener = require('../../../utils/listener');
const md5 = require('../../shop/common/utils/md5');
import _ from '../../../utils/underscore';
import Form from '../../../utils/form';
Page({
  data: {
    isIphoneX: false,
    post_data: {},
    version: '4.0.2',
    glo_is_load: true,
    all_address: '',
    address_remind: false,
    certification_name: '',
    certification_id_number: '',
    certification_status: '订单包含海淘商品，因海关需要，请填写身份信息',
    certification_popup: false,
    certification_tip: '身份信息尚未认证，请确认提交并认证',
    show_gift:false,
    gift_data:'',
    disabled_pay_button:false
  },

  onLoad: function(options) {
    wx.removeStorageSync('all_info');
    var that = this;
    this.form = new Form(this, "form");
    util.trySyncUserInfo();
    if (options.goods_id != undefined) {
      that.data.post_data = options
    }
    if (options.in_type != undefined && options.in_type != 'undefined'){
      that.data.post_data.in_type = options.in_type;
      that.data.post_data.gift_list_arr = JSON.parse(options.gift_list_arr);
    }
    wx.getStorage({
      key: 'shop_name',
      success: function(res) {
        that.setData({
          name: res.data
        })
      }
    })
    wx.getStorage({
      key: 'shop_phone',
      success: function(res) {
        that.setData({
          phone: res.data
        })
      }
    });
    if (wx.getStorageSync('certification_name') && wx.getStorageSync('certification_id_number')){
      that.setData({ certification_name: wx.getStorageSync('certification_name'), certification_id_number: wx.getStorageSync('certification_id_number'), certification_status: wx.getStorageSync('certification_status'), certification_tip: wx.getStorageSync('certification_tip')})
    }
    //请求订单信息
    requestUtil.get(_DuoguanData.duoguan_host_api_url + '/index.php?s=/addon/DuoguanShop/DuoguanShopApi/getOrderInfo.html', {
      goods_id: that.data.post_data.goods_id,
      goods_number: that.data.post_data.goods_number,
      attr_str: that.data.post_data.attr_str,
      goods_attr: that.data.post_data.goods_attr,
      version: that.data.version,
      in_type: that.data.post_data.in_type ? that.data.post_data.in_type : 0,
      gift_list_arr: that.data.post_data.gift_list_arr ? that.data.post_data.gift_list_arr : ''
    }, (info) => {
      // 新版本地址选择
      if (!info.way) {
        info.way = new Array(1);
      }
      if (info.goods_kind == 1) {
        info.way = [];
      }
      if (info.community_config && info.community_config.is_open == 1 && info.community_config.open_express == 0) {
        info.way = [2];
      }

      if (info.form) {
        for (let i = 0; i < info.form.length; i++) {
          let field = info.form[i],
            value = field.value;
          this.form.add(field.title, field.name, field.type, value, field.options);
        }
        this.form.render();
      }
      //地址结束
      that.data.post_data.manjian_id = info.mianjian_id
      that.setData({
        order_info: info,
        post_data: that.data.post_data,
        glo_is_load: false,
      });

      if (info.time_type == 1) {
        that.setData({
          time_type: info.time_type,
          fDate: info.res_date_week,
          week_status: info.res_date_week[0].date,
          week: info.res_date_week[0].week,
          date: info.res_date_week[0].date,
          tpart: info.time_num,
          ck_tpart: info.time_num[0]
        })
      }
      if (info.way.length == 1) {
        that.choose_by_type(info.way[0])
      } else if (that.data.order_info.goods_kind != true && that.data.order_info.way[0] == 1) {
        var e = {};
        e.currentTarget = {};
        e.currentTarget.dataset = {};
        e.currentTarget.dataset.type = 1;
        that.choose_shipping_type(e);
      }else{
        that.setPrice();
      }
      that.getUserQuanInfo();
      if (that.data.post_data.in_type != 1){
        that.getGiftData();
      }
    }, {});
  },
  onShow: function() {
    //获取订单信息
    var that = this;
    // 获取手机信息
    wx.getSystemInfo({
      success: res => {
        // 判断是否是 iPhone X 系列
        let modelmes = res.model;
        if (modelmes.search('iPhone X') != -1) {
          that.setData({
            isIphoneX: true
          });
        }
      }
    });
    requestUtil.get(_DuoguanData.duoguan_host_api_url + '/index.php?s=/addon/DuoguanShop/Api/getCommunityConfig.html', {}, (info) => {
      console.log(info);
      if (info && info.is_open == 1) {
        wx.getLocation({
          type: 'wgs84', //返回可以用于wx.openLocation的经纬度
          success: function(res) {
            var qqmapsdk = util.getMapSdk()
            qqmapsdk.reverseGeocoder({
              location: {
                latitude: res.latitude,
                longitude: res.longitude
              },
              success: (res) => {
                console.log(res)
                requestUtil.get(_DuoguanData.duoguan_host_api_url + '/index.php?s=/addon/DuoguanShop/Api/getSelfAddressByRelation.html', {
                  colonel_uid: info.colonel_uid,
                  lat: res.result.location.lat,
                  lng: res.result.location.lng
                }, (info) => {
                  if (info == '该自提点已更换团长') {
                    wx.showModal({
                      title: '提示',
                      content: '该自提点已更换团长,请重新选择本自提点',
                      showCancel: false
                    })
                    return;
                  } else {
                    that.setData({
                      all_address: info
                    })
                  }
                }, that, {
                  isShowLoading: false
                });
              },
              fail:(res)=>{
                console.log('qqmapsdkfail')
                requestUtil.get(_DuoguanData.duoguan_host_api_url + '/index.php?s=/addon/DuoguanShop/Api/getSelfAddressByRelationNoLocation.html', {
                  colonel_uid: info.colonel_uid
                }, (info) => {
                  if (info == '该自提点已更换团长') {
                    wx.showModal({
                      title: '提示',
                      content: '该自提点已更换团长,请重新选择本自提点',
                      showCancel: false
                    })
                    return;
                  } else {
                    that.setData({
                      all_address: info
                    })
                  }
                }, that, {
                    isShowLoading: false
                  });
              }
            });
          },
          fail: function(res) {
            requestUtil.get(_DuoguanData.duoguan_host_api_url + '/index.php?s=/addon/DuoguanShop/Api/getSelfAddressByRelationNoLocation.html', {
              colonel_uid: info.colonel_uid
            }, (info) => {
              if (info == '该自提点已更换团长') {
                wx.showModal({
                  title: '提示',
                  content: '该自提点已更换团长,请重新选择本自提点',
                  showCancel: false
                })
                return;
              } else {
                that.setData({
                  all_address: info
                })
              }
            }, that, {
              isShowLoading: false
            });
          }
        })
      } else {
        wx.getSetting({
          success: (res) => {
            console.log('getSetting.success')
            console.log(res)
          },
          fail: (res) => {
            console.log('getSetting.fail')
            wx.openSetting({
              success: (res) => {
                console.log('openSetting.success')
                console.log(res)
              },
              fail: (res) => {
                console.log('openSetting.fail')
                console.log(res)
              }
            })
          }
        });
        if (wx.getStorageSync('all_info')) {
          that.setData({
            all_address: wx.getStorageSync('all_info')
          })
        } else {
          requestUtil.get(_DuoguanData.duoguan_host_api_url + '/index.php?s=/addon/DuoguanShop/Api/getLastAddress.html', {}, (info) => {
            console.log(info)
            if (info.code == 1) {
              that.setData({
                all_address: info.info
              })
            } else {
              wx.getLocation({
                type: 'wgs84',
                success: function(res) {
                  console.log(res)
                  that.setData({
                    latitude: res.latitude,
                    longitude: res.longitude
                  })
                  requestUtil.get(_DuoguanData.duoguan_host_api_url + '/index.php?s=/addon/DuoguanShop/Api/getSelfAddress.html', {
                    lat: that.data.latitude,
                    lng: that.data.longitude
                  }, (info) => {
                    that.setData({
                      all_address: info[0]
                    })
                  }, that, {
                    isShowLoading: false
                  });
                }
              })
            }
          }, that, {
            isShowLoading: false
          });

        }
      }
    }, that, {
      isShowLoading: false
    });

  },
  setPrice: function() {
    var that = this
    requestUtil.get(_DuoguanData.duoguan_host_api_url + '/index.php?s=/addon/DuoguanShop/DuoguanShopApi/getOrderPrice.html', {
      data: that.data.post_data,
      version: that.data.version,
      in_type: that.data.post_data.in_type ? that.data.post_data.in_type : 0,
      gift_list_arr: that.data.post_data.gift_list_arr ? that.data.post_data.gift_list_arr : ''
    }, (info) => {
      that.setData({
        glo_is_load: false,
        price_info: info
      })
    }, that, {
      isShowLoading: false
    });
  },
  go_select_dai_bind: function() {
    //跳转优惠券选择页面。
    var that = this
    if (that.data.post_data.goods_id > 0) {
      wx.navigateTo({
        url: '../mallquanselect/index?goods_id=' + that.data.post_data.goods_id + '&goods_number=' + that.data.post_data.goods_number + '&goods_attr=' + that.data.post_data.goods_attr + '&all_price=' + that.data.order_info.all_g_price
      });
    } else {
      wx.navigateTo({
        url: '../mallquanselect/index?all_price=' + that.data.order_info.all_g_price
      });
    }
    let quan_callback = (res) => {
      listener.removeEventListener('shop.order.choose.discount', quan_callback)
      that.data.post_data.quan_id = res
      //重新请求获取订单信息
      that.setPrice();
    }
    listener.addEventListener('shop.order.choose.discount', quan_callback);

  },
  /**
   * 切换配送方式
   */
  choose_shipping_type: function(e) {
    var that = this
    that.data.post_data.shipping_type = e.currentTarget.dataset.type
    if (that.data.post_data.shipping_type == 1) {
      var value = false
      if (this.data.post_data.wxAddress) {
        value = this.data.post_data.wxAddress
      } else if (this.data.order_info.default_address != '') {
        value = this.data.order_info.default_address
      } else {
        value = wx.getStorageSync('shop_wx_address_info')
      }
      if (value) {
        // Do something with return value
        this.data.post_data.wxAddress = value
      } else {
        this.select_address_bind()
      }
    }
    that.setData({
      post_data: that.data.post_data
    })
    that.setPrice();
  },
  select_address_bind: function() {
    var that = this
    //显示地址列表，地址列表为空时跳转地址管理页面
    util.chooseAddress(function(res) {
      if (res.wxAddress != undefined) {
        that.data.post_data.wxAddress = {}
        that.data.post_data.wxAddress = res.wxAddress
      } else if (res.qqmap_address != undefined) {
        that.data.post_data.wxAddress = {}
        that.data.post_data.wxAddress.provinceName = res.qqmap_address.province
        that.data.post_data.wxAddress.cityName = res.qqmap_address.city
        that.data.post_data.wxAddress.countyName = res.qqmap_address.district
        that.data.post_data.wxAddress.detailInfo = res.detail_info
        that.data.post_data.wxAddress.userName = res.name
        that.data.post_data.wxAddress.telNumber = res.mobile
        that.data.post_data.wxAddress.nationalCode = res.province_id
        that.data.post_data.wxAddress.postalCode = res.province_id
        that.data.post_data.wxAddress.address = res.address
      }
      that.setData({
        post_data: that.data.post_data
      })
      that.setPrice();
    });
  },

  addressRemind: function() {
    var that = this;
    if (that.data.post_data.shipping_type == 2) {
      that.setData({
        address_remind: !that.data.address_remind
      })
    }
  },

  //提交订单
  order_formSubmit: function(e) {
    var that = this;
    if (e.detail.value.shipping_type == '到店取货') {
      if (e.detail.value.phone.search(/^([0-9]{11})?$/) == -1) {
        wx.showModal({
          content: '请输入正确的手机号！',
          showCancel: false
        });
        return;
      }
    }
    if (that.data.order_info.goods_kind == 2) {
      if (!that.data.certification_name || !that.data.certification_id_number) {
        wx.showModal({
          content: '请输入正确清关信息！',
          showCancel: false
        });
        return;
      }
    }
    if (that.data.order_info.is_certification == 1 && that.data.certification_status == '未认证'){
      wx.showModal({
        content: '身份信息未通过认证',
        showCancel: false
      });
      return;
    }
    if (that.data.post_data.shipping_type == 2 && (!e.detail.value.name || !e.detail.value.phone)){
      wx.showModal({
        content: '请完善取货人信息',
        showCancel: false
      });
      return;
    }
    if (that.data.post_data.shipping_type == 2 && that.data.order_info.shop_config.must_fill == 1 && (!e.detail.value.res_date || !e.detail.value.res_time || !e.detail.value.res_week)) {
      wx.showModal({
        content: '请完善预约时间',
        showCancel: false
      });
      return;
    }

    wx.showToast({
      title: '加载中',
      icon: 'loading',
      duration: 1000,
      mask: true
    });
    that.setData({
      btn_submit_disabled: true
    });
    var order_info = e.detail.value;
    order_info.extra = this.form.getSerializeValues();
    order_info.form = that.data.order_info.form;
    order_info.wx_address = that.data.post_data.wxAddress;
    order_info.quan_id = that.data.post_data.quan_id;
    order_info.manjian_id = that.data.order_info.mianjian_id;
    order_info.form_id = e.detail.formId;
    order_info.version = that.data.version
    order_info.order_key = wx.getStorageSync("utoken") + '_' + that.data.order_info.glist[0].goods_info.goods_id
    order_info.goods_id = that.data.post_data.goods_id
    order_info.goods_number = that.data.post_data.goods_number
    order_info.goods_attr = that.data.post_data.goods_attr
    order_info.attr_str = that.data.post_data.attr_str
    order_info.usecard = 1
    order_info.shipping_type = that.data.post_data.shipping_type
    order_info.time_type = that.data.order_info.time_type
    order_info.self_address_name = that.data.all_address.address_name
    order_info.self_address = that.data.all_address
    order_info.fx_apply_order = that.data.post_data.fx_apply_order ? that.data.post_data.fx_apply_order : 0;
    order_info.certification_name = that.data.certification_name
    order_info.certification_id_number = that.data.certification_id_number
    order_info.goods_kind = that.data.order_info.goods_kind
    order_info.is_certification = that.data.order_info.is_certification
    order_info.in_type = that.data.post_data.in_type ? that.data.post_data.in_type : 0;
    order_info.gift_list_arr = that.data.post_data.gift_list_arr ? that.data.post_data.gift_list_arr : '';
    // order_info.supplier_split_order = that.data.order_info.supplier_split_order
    order_info = JSON.stringify(order_info)
    var sign = md5.md5(order_info + md5.md5('sign'))
    requestUtil.post(_DuoguanData.duoguan_host_api_url + '/index.php?s=/addon/DuoguanShop/DuoguanShopApi/postOrder.html', {
        oinfo: order_info,
        sign: sign
      },
      (data) => {
        wx.setStorage({
          key: "shop_name",
          data: e.detail.value.name == undefined ? '' : e.detail.value.name
        })
        wx.setStorage({
          key: "shop_phone",
          data: e.detail.value.phone == undefined ? '' : e.detail.value.phone
        })
        wx.setStorage({
          key: "shop_wx_address_info",
          data: that.data.post_data.wxAddress
        })
        wx.hideToast();
        // that.setData({
        //   btn_submit_disabled: false
        // });
        //跳转支付
        var order_id = data;
        that.setData({
          order_id: order_id
        })
        that.getPayOrderInfo();
        // wx.redirectTo({
        //   url: '../orderpay/index?order_id=' + order_id
        // })
      }, this, {
        isShowLoading: false,
        complete: function() {
          that.setData({
            btn_submit_disabled: false
          });
        }
      });
  },
  //根据类别选择取货方式
  choose_by_type: function(type) {
    var that = this
    this.data.post_data.shipping_type = type
    if (type == 1) {
      var value = false
      if (this.data.post_data.wxAddress) {
        value = this.data.post_data.wxAddress
      } else if (this.data.order_info.default_address != '') {
        value = this.data.order_info.default_address
      } else {
        value = wx.getStorageSync('shop_wx_address_info')
      }
      if (value) {
        // Do something with return value
        this.data.post_data.wxAddress = value
      } else {
        this.select_address_bind()
      }
    }
    that.setData({
      post_data: that.data.post_data
    })
    that.setPrice();
  },

  //控制时间弹出框
  bindTime: function() {
    this.setData({ //打开
      is_time: 1,
    })

    var that = this;
    var date_week = that.data.fDate;
    var all_time = that.data.ck_tpart;
    // that.setData({
    // date: date_week[0].date,//默认最近日期
    // week: date_week[0].week,//默认最近日期周几
    // week_status: date_week[0].date,//默认最近日期选中状态
    // })

  },
  //关闭时间选择
  bindTimeClose: function() {
    this.setData({
      is_time: 0,
      date: '',
      time: '',
      week: '',
      week_status: '',
      time_status: '',
    })
  },
  //选择日期
  bindChangeDate: function(e) {
    // 日期选中状态
    var that = this;
    var fDate = that.data.fDate; //日期
    var time_type = that.data.time_type; //时段类型
    var date_check = e.currentTarget.dataset.index; //选中的日期

    var j = 0; //选中日期对象下标
    for (var i = 0; i < fDate.length; i++) {
      if (fDate[i].date == date_check) {
        j = i;
      }
    }
    for (let i = 0; i < fDate.length; i++) {
      var date = fDate[i].date;
      if (date == date_check) {
        var date_ck = fDate[i].date;
        var week_ck = fDate[i].week;
      }
    }
    that.setData({
      week_status: date_check,
      week: week_ck,
      date: date_ck,
      time: '', //清空之前时间段选择
      time_status: '',
      ck_tpart: that.data.tpart[j], //切换显示可选时段
    })

  },
  //选择时段
  bindChangeTime: function(e) {
    var time = e.currentTarget.dataset.index;
    this.setData({
      time_status: time,
      time: time,
    })
  },
  //选中时间关闭
  changTimeOver: function() {
    this.setData({
      is_time: 0,
      // week_status: '',
      // time_status: '',
    })
  },
  selectSelfAddress: function() {
    wx.navigateTo({
      url: '../business-address/index'
    })
  },
  //电话
  bind_contant_phone: function() {
    var that = this
    wx.makePhoneCall({
      phoneNumber: that.data.all_address.mobile
    })
  },
  to_self_adress: function() {
    wx.openLocation({
      latitude: parseFloat(this.data.all_address.latitude),
      longitude: parseFloat(this.data.all_address.longitude),
      scale: 28,
      name: this.data.all_address.address
    })
  },
  getUserQuanInfo: function() {
    var that = this;
    requestUtil.get(_DuoguanData.duoguan_host_api_url + '/index.php?s=/addon/DuoguanShop/Api/listUserQuan.html', {
      qtype: 0,
      all_price: that.data.order_info.all_g_price,
      version: 109,
      gid: that.data.post_data.goods_id
    }, (info) => {
      if (info == null) {
        that.setData({
          able_quan_list: null,
          disable_quan_list: null,
          glo_is_load: false
        });
      } else {
        that.setData({
          able_quan_list: info.able_list,
          disable_quan_list: info.disable_list,
          glo_is_load: false
        });
      }
    }, {});
  },
  getPayOrderInfo: function(order_id) {
    var that = this;
    requestUtil.get(_DuoguanData.duoguan_host_api_url + "/index.php?s=/addon/DuoguanShop/OrderApi/orderInfo.html", {
      oid: that.data.order_id
    }, (info) => {
      that.setData({
        oinfo: info
      })
      requestUtil.get(_DuoguanData.duoguan_host_api_url + "/index.php?s=/addon/Card/CardApi/getMyCardInfo.html", {}, (info) => {
        if (that.data.address_remind && !info.status && that.data.oinfo.public_info.is_huodaofukuan != 1) {
          //到店自提情况下只有微信支付
          var e = {};
          e.detail = {};
          e.detail.value = {};
          e.detail.value.pay_name = 0;
          e.detail.formId = '';
          that.pay_confirmOrder(e);
        } else {
          that.setData({
            cardinfo: info,
            pay_show: true
          });
        }
      }, that, {});
    }, this, {});
  },
  //开始支付
  pay_confirmOrder: function(e) {
    var that = this;
    that.setData({disabled_pay_button:true});
    requestUtil.get(_DuoguanData.duoguan_host_api_url + '/index.php?s=/addon/DuoguanShop/DuoguanShopApi/makePay.html', {
      oid: that.data.order_id,
      pay_name: e.detail.value.pay_name,
      formId: e.detail.formId,
      version: that.data.version
    }, (info, data) => {
      if (info === '零元商品支付成功') {
        that.importPurchaseOrder(that.data.order_id);
        wx.redirectTo({
          url: '../pay-success/pay-success?order_id=' + that.data.order_id,
        });
      } else if (e.detail.value.pay_name == '0') {
        Object.assign(info, {
          'success': function(res) {
            //支付完成 跳转订单列表
            wx.redirectTo({
              url: '../pay-success/pay-success?order_id=' + that.data.order_id
            })
          },
          'fail': function(res) {
            console.log('fail'.res);
            wx.redirectTo({
              url: '../order/list/index'
            })
          },
          'complete': function() {
            that.setData({
              disabled: false
            })

          }
        });
        wx.requestPayment(info);
      } else if (e.detail.value.pay_name == '1') {
        if (info == '余额支付成功') {
          that.importPurchaseOrder(that.data.order_id);
          wx.redirectTo({
            url: '../pay-success/pay-success?order_id=' + that.data.order_id,
          });
        } else if (data.info == '余额不足') {
          that.setData({
            buttonIsDisabled: false,
            submitIsLoading: false
          })
          wx.navigateTo({
            url: '/pages/user/mcard/recharge',
          });
        }
      } else if (e.detail.value.pay_name == '2') {
        if (info == '货到付款设置成功') {
          that.importPurchaseOrder(that.data.order_id);
          wx.redirectTo({
            url: '../pay-success/pay-success?order_id=' + that.data.order_id,
          });
        }
      }

    }, this, {
      isShowLoading: true
    });

  },
  payClose: function() {
    var that = this;
    that.setData({
      pay_show: false
    })
    wx.redirectTo({
      url: '../order/list/index'
    })
  },
  importPurchaseOrder: function (order_id) {
    var that = this;
    requestUtil.get(_DuoguanData.duoguan_host_api_url + "/index.php?s=/addon/DuoguanShop/DuoguanShopApi/wxImportPurchaseOrder.html", {
      oid: order_id
    }, (info) => { }, this, {});
  },
  certificationPopup: function() {
    this.setData({
      certification_popup: !this.data.certification_popup
    });
  },
  checkCertificationInfo: function(e) {
    var that = this;
    requestUtil.pushFormId(e.detail.formId);
    if (!e.detail.value.name || e.detail.value.length > 10) {
      wx.showModal({
        content: '姓名不能为空或者长度不能大于10',
        showCancel: false
      });
      return;
    }
    if (e.detail.value.id_number.search(/^[1-9]{1}\d{5}(16|17|18|19|20)\d{2}((0[1-9])|(10|11|12))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$/) == -1) {
      wx.showModal({
        content: '身份证不合法!',
        showCancel: false
      });
      return;
    }
    if (that.data.order_info.is_certification == 1) { //需要认证
      requestUtil.get(_DuoguanData.duoguan_host_api_url + "/index.php?s=/addon/DuoguanShop/OrderApi/checkId.html", {
        name: e.detail.value.name,
        id_number: e.detail.value.id_number
      }, (info) => {
        console.log(info);
        if (info.info.status != 1) {
          wx.showModal({
            content: info.info.msg,
            showCancel: false
          });
          that.setData({
            certification_tip: info.info.msg
          })
        } else {
          wx.showModal({
            content: '认证通过',
            showCancel: false
          });
          that.setData({
            certification_name: e.detail.value.name,
            certification_id_number: e.detail.value.id_number,
            certification_popup: false,
            certification_status: '已认证',
            certification_tip: '已通过认证'
          });
          wx.setStorage({
            key: "certification_name",
            data: e.detail.value.name
          });
          wx.setStorage({
            key: "certification_id_number",
            data: e.detail.value.id_number
          });
          wx.setStorage({
            key: "certification_status",
            data: '已认证'
          });
          wx.setStorage({
            key: "certification_tip",
            data: '已通过认证'
          });
        }
      }, this, {});
    } else { //不需要认证
      that.setData({
        certification_name: e.detail.value.name,
        certification_id_number: e.detail.value.id_number,
        certification_popup: false,
        certification_status: '未认证',
        certification_tip: '已通过认证'
      });
      wx.setStorage({
        key: "certification_name",
        data: e.detail.value.name
      });
      wx.setStorage({
        key: "certification_id_number",
        data: e.detail.value.id_number
      });
      wx.setStorage({
        key: "certification_status",
        data: '未认证'
      });
      wx.setStorage({
        key: "certification_tip",
        data: '未认证'
      });
    }
  },
  getGiftData:function(){
    var that = this;
    var goods_id = 0;
    if (that.data.post_data.goods_id != undefined && that.data.post_data.goods_id != 'undefined' && that.data.post_data.goods_id > 0) goods_id = that.data.post_data.goods_id;
    requestUtil.get(_DuoguanData.duoguan_host_api_url + "/index.php?s=/addon/MarketingGift/Api/getUserGiftList.html", { in_type: 2, module: 'DuoguanShop', goods_id: goods_id, all_goods_price: that.data.order_info.all_g_price}, (info) => {
      // console.log(info.length);
      // if(info.length > 0){
      //   that.setData({ show_gift: true, gift_data: info.slice(0,5)})
      // }
    }, this, {
        success: function (info) {
          if (info.data.code == 1 && info.data.data.length > 0) {
            that.setData({ show_gift: true, gift_data: info.data.data.slice(0, 5) })
          }
        }
    });
  },
  goSelectGift:function(){
    var that = this;
    var goods_id = 0;
    if (that.data.post_data.goods_id != undefined && that.data.post_data.goods_id != 'undefined' && that.data.post_data.goods_id > 0) goods_id = that.data.post_data.goods_id;
    if(goods_id > 0){
      wx.navigateTo({
        url: '/pages/user/giftsLibrary/index/index?in_type=2&goods_id=' + goods_id + '&all_goods_price=' + that.data.order_info.all_g_price + '&goods_number=' + that.data.post_data.goods_number + '&attr_str=' + that.data.post_data.attr_str + '&goods_attr=' + that.data.post_data.goods_attr
      })
    }else{
      wx.navigateTo({
        url: '/pages/user/giftsLibrary/index/index?in_type=2&goods_id=' + goods_id + '&all_goods_price=' + that.data.order_info.all_g_price
      })
    }
  }
})