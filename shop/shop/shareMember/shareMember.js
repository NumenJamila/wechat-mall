// pages/shop/shareMember/shareMember.js
const app = getApp();
const requestUtil = require('../../../utils/requestUtil');
const _DuoguanData = require('../../../utils/data');
const md5 = require('../../shop/common/utils/md5');
const WxParse = require('../../../wxParse/wxParse.js');
import {
  duoguan_host_api_url as API_URL
} from "../../../utils/data";
Page({

  /**
   * 页面的初始数据
   */
  data: {
    // type为1 自己分享页，为2 好友领取页
    type:2,
    cardNum:156,   //分享会员剩余数量
    send_info:[],
    can_receive:true,
    receive_page: 1,
    receive_list: [],
    receive_load_more: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var that = this;
    that.setData({
      type:options.type,
      share_uid: options.share_uid ? options.share_uid : 0,
      send_id: options.send_id ? options.send_id : 0
    });
    if (that.data.share_uid == wx.getStorageSync("user_info").uid){
      that.setData({type:1})
    }
    if (that.data.type != 1) wx.hideShareMenu();
    that.getVipSendInfo();
    that.getReceiveList();
  },

  getVipSendInfo:function(){
    var that = this;
    requestUtil.get(_DuoguanData.duoguan_host_api_url + '/index.php?s=/addon/DuoguanShop/UserApi/getVipSendInfo', {
      type: that.data.type, share_uid: that.data.share_uid, send_id:that.data.send_id
    }, (info) => {
      if (!info.is_satisfy){
        wx.showToast({
          title: info.no_satisfy_info,
          icon: 'none',
          duration: 2000
        })
      }
      that.setData({
        send_info: info,
        type: info.type,
        can_receive:true
      });
    });
  },

  getReceiveList: function () {
    var that = this;
    if (that.data.receive_page > 1) {
      wx.showLoading({
        title: '加载中',
        mask: true
      });
      setTimeout(function () {
        wx.hideLoading()
      }, 1000)
    }
    requestUtil.get(_DuoguanData.duoguan_host_api_url + '/index.php?s=/addon/DuoguanShop/UserApi/getReceiveList', {
      type: that.data.type, share_uid: that.data.share_uid, send_id: that.data.send_id, page: that.data.special_page
    }, (data) => {
      if (data == null || data == '') {
        that.setData({
          receive_load_more: false
        })
      } else if (data.length < 5) {
        var receive_list = that.data.receive_list.concat(data);
        that.setData({
          receive_list: receive_list,
          receive_load_more: false
        })
      } else {
        var receive_list = that.data.receive_list.concat(data);
        that.setData({
          receive_list: receive_list,
          receive_page: that.data.receive_page + 1,
          receive_load_more: true
        })
      }
    });
  },

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
            this.setData({
              phone: info['phone']
            });
            this.receiveSendVip(info['phone']);
          }
        });
    };
    handler();
  },

  receiveSendVip: function (authorize_phone){
    var that = this;
    that.setData({ can_receive:false});
    if (authorize_phone == '' || authorize_phone == 'undefined' || authorize_phone == undefined) return;
    requestUtil.get(_DuoguanData.duoguan_host_api_url + '/index.php?s=/addon/DuoguanShop/UserApi/receiveSendVip.html', { share_uid: that.data.share_uid, send_id: that.data.send_id, authorize_phone: authorize_phone, name: wx.getStorageSync("user_info").nickname}, (info) => {
      if(info.code == 1){
        wx.showToast({
          title: info.info,
          icon:'success',
          duration:2000
        })
      }else{
        wx.showToast({
          title: info.info,
          icon: 'none',
          duration: 2000
        })
      }
      that.getVipSendInfo();
    }, that, { isShowLoading: false });
  },

  jumpToSuperMember:function(){
    wx.redirectTo({
      url: '/pages/shop/superMember/superMember',
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
    var that = this;
    var title = wx.getStorageSync("user_info").nickname + '送你VIP+券';
    var path = '/pages/shop/shareMember/shareMember?type=2&share_uid=' + that.data.send_info.share_info.uid + '&send_id=' + that.data.send_info.share_info.send_id;
    return{
      title: title,
      path: path
    }
  }
})