// pages/plug-in/giftsLibrary/index/index.js
const app = getApp();
const requestUtil = require('../../../../utils/requestUtil');
const _DuoguanData = require('../../../../utils/data');
Page({

  /**
   * 页面的初始数据
   */
  data: {
    giftsTck:false,
    in_type:1,
    gift_list:'',
    module:'DuoguanShop',
    tips:{},
    buy_list:{},
    all_select_num:0,
    module_buy_path:{
      'DuoguanShop': '/pages/shop/mallsure/mallsure?'
    },
    goods_id:0,
    all_goods_price:0,
    goods_number:0,
    attr_str:'',
    goods_attr:''
  },
  
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var that = this;
    that.setData({ 
      in_type: options.in_type, 
      goods_id: options.goods_id ? options.goods_id : 0, 
      all_goods_price: options.all_goods_price ? options.all_goods_price : 0,
    });
    if(that.data.goods_id > 0){
      that.setData({
        goods_number: options.goods_number ? options.goods_number : 0,
        attr_str: options.attr_str ? options.attr_str : '',
        goods_attr: options.goods_attr ? options.goods_attr : ''
      })
    }
    that.onPullDownRefresh();
  },

  getUserGiftList:function(){
    var that = this;
    requestUtil.get(_DuoguanData.duoguan_host_api_url + '/index.php?s=/addon/MarketingGift/Api/getUserGiftList.html', {
      in_type: that.data.in_type, module: that.data.module, goods_id:that.data.goods_id, all_goods_price:that.data.all_goods_price
    }, (info) => {
      that.setData({gift_list:info});
    }, {});
  },

  recorgGo: function (e) {
    let url = e.currentTarget.dataset.url
    wx.navigateTo({
      url: url,
      success: function (res) { },
      fail: function (res) { },
      complete: function (res) { },
    })
  },

  tckClick: function (e) {
    var that = this;
    console.log(e);
    var tips = {};
    tips.goods_name = e.currentTarget.dataset.goods_name;
    tips.have_buy_condition_str = e.currentTarget.dataset.have_buy_condition_str;
    tips.buy_limit = e.currentTarget.dataset.buy_limit == 1 ? 1 : '多';
    tips.one_buy_num = e.currentTarget.dataset.one_buy_num;
    tips.send_num = e.currentTarget.dataset.send_num;
    tips.remain_num = e.currentTarget.dataset.remain_num;
    tips.exchange_num = tips.send_num - tips.remain_num;
    tips.end_days_str = e.currentTarget.dataset.end_days_str;
    tips.id = e.currentTarget.dataset.id;
    that.setData({
      giftsTck: (!this.data.giftsTck),
      tips : tips
    })
  },

  giftSelectAdd:function(e){
    var that = this;
    var index = e.currentTarget.dataset.index;
    var gift_id = e.currentTarget.dataset.gift_id;
    var send_id = e.currentTarget.dataset.send_id;
    var buy_list = that.data.buy_list;
    var gift_list = that.data.gift_list;
    var all_select_num = that.data.all_select_num;
    if (buy_list[gift_id]){
      if (gift_list[index].id != 0 && gift_list[index].remain_num < buy_list[gift_id].select_num + 1){//超出剩余数量
        wx.showModal({
          title: '提示',
          content: '添加超出数量上限',
          showCancel: false
        });
        return;
      }
      if (gift_list[index].one_buy_num < buy_list[gift_id].select_num + 1) {//超出剩余数量
        wx.showModal({
          title: '提示',
          content: '添加超出每次可购买上限',
          showCancel: false
        });
        return;
      }
      buy_list[gift_id].select_num = buy_list[gift_id].select_num + 1;
      gift_list[index].select_num = gift_list[index].select_num + 1;
    }else{//第一次增加
      buy_list[gift_id] = {};
      buy_list[gift_id].select_num = 1;
      buy_list[gift_id].gift_id = gift_id;
      buy_list[gift_id].send_id = send_id;
      gift_list[index].is_select = true;
      gift_list[index].select_num = 1;
    };
    all_select_num = all_select_num + 1;
    if (gift_list[index].no_single_buy == 0) {//该商品不能与其他商品一起购买
      for (var i = 0; i < gift_list.length; i++) {
        if (i != index) {
          gift_list[i].can_select = false;//其他商品不能购买
        }
      }
    } else if (gift_list[index].no_single_buy == 1) {//该商品可以与其他商品一起购买
      for (var i = 0; i < gift_list.length; i++) {
        if (i != index && gift_list[i].no_single_buy == 0) {
          gift_list[i].can_select = false;//不能与其他商品一起购买的商品不能购买
        }
      }
    }
    that.setData({
      buy_list: buy_list,
      gift_list: gift_list,
      all_select_num: all_select_num,
    });

  },

  giftSelectReduce:function(e){
    var that = this;
    var index = e.currentTarget.dataset.index;
    var gift_id = e.currentTarget.dataset.gift_id * 1;
    var buy_list = that.data.buy_list;
    var gift_list = that.data.gift_list;
    var all_select_num = that.data.all_select_num;
    if (buy_list[gift_id].select_num - 1 <= 0){//减到最后一个
      gift_list[index].is_select = false;
      if (gift_list[index].no_single_buy == 0) {//该商品不能与其他商品一起购买
        for (var i = 0; i < gift_list.length; i++) {
            gift_list[i].can_select = true;//其他商品恢复可以购买
        }
      } else if (gift_list[index].no_single_buy == 1){//该商品可以与其他商品一起购买
        for (var i = 0; i < gift_list.length; i++) {
          if (i != index && gift_list[i].no_single_buy == 0) {
            gift_list[i].can_select = true;//不能与其他商品一起购买的商品回复可以购买
          }
        }
      }
      gift_list[index].select_num = 0;
      delete buy_list[gift_id];
      all_select_num = all_select_num - 1;
    }else{
      gift_list[index].select_num = gift_list[index].select_num - 1;
      buy_list[gift_id].select_num = buy_list[gift_id].select_num - 1;
      all_select_num = all_select_num - 1;
    }
    that.setData({
      buy_list: buy_list,
      gift_list: gift_list,
      all_select_num: all_select_num,
    });
  },

  goBuy:function(){
    var that = this;
    var buy_list = that.data.buy_list;
    var gift_list_arr = [];
    if (JSON.stringify(buy_list) == '{}'){
      wx.showModal({
        title: '提示',
        content: '请选择赠品',
        showCancel: false
      });
      return;
    };
    for(let i in buy_list){
      gift_list_arr.push(buy_list[i]);
    };
    gift_list_arr = JSON.stringify(gift_list_arr);
    if(that.data.goods_id > 0){
      wx.reLaunch({
        url: that.data.module_buy_path[that.data.module] + 'in_type=' + that.data.in_type + '&gift_list_arr=' + gift_list_arr + '&goods_id=' + that.data.goods_id + '&goods_number=' + that.data.goods_number + '&attr_str=' + that.data.attr_str + '&goods_attr=' + that.data.goods_attr,
      });
    }else{
      wx.redirectTo({
        url: that.data.module_buy_path[that.data.module] + 'in_type=' + that.data.in_type + '&gift_list_arr=' + gift_list_arr,
      });
    }
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
    var that = this;
    that.getUserGiftList();
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },
})