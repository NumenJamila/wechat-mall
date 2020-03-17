// pages/user/myBusinessCard/myBusinessCard.js
const app = getApp();
const requestUtil = require('../../../../utils/requestUtil');
const _DuoguanData = require('../../../../utils/data');
Page({

  /**
   * 页面的初始数据
   */
  data: {
    service_card_list:''
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var that = this;
    that.checkHigher();
  },

  checkHigher: function () {
    var that = this;
    requestUtil.get(_DuoguanData.duoguan_host_api_url + '/index.php?s=/addon/ServiceCard/Api/checkHigher', {}, (info) => {
      if(info.code == 1){//未绑定或上级不是客服人员
        console.log(1)
        that.getUserServiceCard();
      }else if(info.code == 2){//客服人员
        console.log(2)
        wx.redirectTo({
          url: '/pages/user/businessCard/myCardDetail/myCardDetail?id=' + info.id,
        })
      } else if (info.code == 3) {//被客服人员绑定
        var sync_service_info = wx.getStorageSync('service_card_info');
        console.log('sync_service_info', sync_service_info);
        var service_card_arr = info.service_card_arr;
        console.log('service_card_arr', info);
        if (sync_service_info && service_card_arr.includes(sync_service_info.id)){
          console.log(3)
          wx.redirectTo({
            url: '/pages/user/businessCard/myCardDetail/myCardDetail?id=' + sync_service_info.id,
          })
        }else{
          console.log(4)
          that.getUserServiceCard();
        }
      }
    }, this, { isShowLoading: true });
  },

  getUserServiceCard:function(){
    var that = this;
    requestUtil.get(_DuoguanData.duoguan_host_api_url + '/index.php?s=/addon/ServiceCard/Api/getUserServiceCard', {}, (info) => {
      that.setData({ service_card_list: info });
    }, this, { isShowLoading: true });
  },

  // 页面跳转
  linkToTap:function(e){
    var id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: '/pages/user/businessCard/myCardDetail/myCardDetail?id='+id,
    })
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

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
})