// pages/user/myCardDetail/myCardDetail.js
const app = getApp();
const requestUtil = require('../../../../utils/requestUtil');
const _DuoguanData = require('../../../../utils/data');
const WxParse = require('../../../../wxParse/wxParse.js');
import util from '../../../../utils/util';
Page({

  /**
   * 页面的初始数据
   */
  data: {
    service_card_info:'',
    show_keep:false,
    authorize:false,
    authorize_info:{
      phone:'',
      isDisabled:false
    },
    form_id_num:0
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var that = this;
    that.getUserInfo();
    that.setData({options:options});
    that.checkCustomer(options);
    that.getServiceInfo(options);
    that.getServiceFormIdNum();
  },

  getUserInfo:function(){
    var that = this;
    requestUtil.get(_DuoguanData.duoguan_user_info_url, {}, (data) => {
      that.setData({
        userInfo: data
      });
    });
  },

  getServiceInfo: function (options){
    var that = this;
    requestUtil.get(_DuoguanData.duoguan_host_api_url + '/index.php?s=/addon/ServiceCard/Api/getServiceInfo', { id: options.id}, (info) => {
      that.setData({ service_card_info: info });
      wx.removeStorageSync('service_card_info');
      wx.setStorage({ key: 'service_card_info', data: that.data.service_card_info});
      WxParse.wxParse('article', 'html', info.content, that, 0)
    }, this, { isShowLoading: true });
  },

  checkCustomer:function(options){
    var that = this;
    requestUtil.get(_DuoguanData.duoguan_user_info_url, {}, (data) => {
      that.setData({
        userInfo: data
      });
      if (options.other_uid && options.other_uid != that.data.userInfo.uid) {
        // requestUtil.get(_DuoguanData.duoguan_host_api_url + '/index.php?s=/addon/ServiceCard/Api/checkCustomer', { higher_uid: options.other_uid }, (info) => {
        //   if (info.code == 1) {
        //     util.trySyncUserInfo();
        //     that.bindCustomer();
        //   }
        // }, this, { isShowLoading: true });
        util.trySyncUserInfo();
        requestUtil.get(_DuoguanData.duoguan_host_api_url + '/index.php/addon/DuoguanUser/DistributionApi/CreateRelation.html', { otheruid: options.other_uid }, (data) => { console.log(data) }, this, { isShowLoading: false })
      }
    });
  },

  // 页面跳转
  linkToTap: function () {
    var that = this;
    if (that.data.service_card_info.uid == that.data.userInfo.uid){
      var url = '/pages/user/businessCard/myClient/myClient?id=' + that.data.service_card_info.id;
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

  linkToAi:function(){
    var that = this;
    if (that.data.service_card_info.uid == that.data.userInfo.uid) {
      var url = '/pages/user/businessCard/locus/locus?id=' + that.data.service_card_info.id;
      wx.navigateTo({
        url: url,
      })
    }else{
      wx.showModal({
        title: '提示',
        content: '身份不符合',
        showCancel: false
      })
    }
  },

  call:function(){
    wx.makePhoneCall({
      phoneNumber: this.data.service_card_info.mobile
    })
  },

  showAuthorize:function(){
    var that = this;
    if(that.data.userInfo.u_phone){
      that.showKeep();
    }else{
      this.setData({ authorize: !this.data.authorize })
    }
  },

  showKeep:function(){
    this.setData({ show_keep: !this.data.show_keep})
  },

  keepMobile:function(e){
    console.log(e)
    var that = this;
    that.setData({show_keep: false});
    wx.addPhoneContact({
      firstName: that.data.service_card_info.realname,
      nickName: that.data.service_card_info.nickname,
      mobilePhoneNumber: that.data.service_card_info.mobile,
      organization: that.data.service_card_info.company_name,
      title: that.data.service_card_info.tags
    })
  },

  goHome:function(){
    console.log(_DuoguanData.duoguan_app_index_path)
    wx.switchTab({
      url: _DuoguanData.duoguan_app_index_path,
    })
  },

  closeAuthorize:function(){
    this.setData({ authorize: false})
    this.showKeep();
  },

  inputName: function (e) {
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
      that.setData({ authorize: false });
      this.showKeep();
      return;
    }

    const handler = () => {
      const url = _DuoguanData.duoguan_host_api_url + '/index.php?s=/addon/ServiceCard/Api/openCardByWxPhone.html';
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
            this.showKeep();
            
          }
        });
    };
    handler();
  },

  keepUserMobile:function(){
    var that = this;
    that.setData({ authorize: false });
    requestUtil.get(_DuoguanData.duoguan_host_api_url + '/index.php?s=/addon/ServiceCard/Api/keepUserMobile', {
      phone: that.data.authorize_info.phone,
    }, (info) => {
      that.getUserInfo();
    }, this, { isShowLoading: true });
  },

  bindCustomer:function(){
    var that = this;
    requestUtil.get(_DuoguanData.duoguan_host_api_url + '/index.php?s=/addon/ServiceCard/Api/bindCustomer', { 
      higher_uid: that.data.options.other_uid,
      // phone: that.data.authorize_info.phone,
      // name: that.data.authorize_info.name
      }, (info) => {
    }, this, { isShowLoading: true });
  },

  openMap:function(){
    var that = this
    wx.chooseLocation({
      success: function (res) {
        that.setData({
          now_address: res.address,
          latitude: res.latitude,
          longitude: res.longitude
        })
      },
      fail: function (res) {
        wx.getSetting({
          success(res) {
            if (!res.authSetting['scope.userLocation']) {
              wx.openSetting({ success: (res) => { } })
            }
          }
        })
      }
    })
  },

  pushFormId: function (e) {
    var that = this;
    requestUtil.pushFormId(e.detail.formId);
    that.getServiceFormIdNum();
  },

  getServiceFormIdNum:function(){
    var that = this;
    requestUtil.get(_DuoguanData.duoguan_host_api_url + '/index.php?s=/addon/ServiceCard/Api/getServiceFormIdNum', {}, (info) => {
      that.setData({ form_id_num: info });
    }, this, { isShowLoading: true });
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },
  copyTextTap:function(e){
    var data = e.currentTarget.dataset.text;
    wx.setClipboardData({
      data: data,
    })
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
    var that = this;
    var log_other_uid = wx.getStorageSync("user_info").uid;
    return {
      path: '/pages/user/businessCard/myCardDetail/myCardDetail?id=' + that.data.service_card_info.id + '&other_uid=' + that.data.service_card_info.uid + '&log_other_uid=' + log_other_uid
    }
  }
})