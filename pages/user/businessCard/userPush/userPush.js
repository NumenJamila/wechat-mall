// pages/user/userPush/userPush.js
const app = getApp();
const requestUtil = require('../../../../utils/requestUtil');
const _DuoguanData = require('../../../../utils/data');
Page({

  /**
   * 页面的初始数据
   */
  data: {
    module_list:'',
    open_select:false,
    module_index:0,
    active_index:0,
    active_info:[],
    page:1,
    page_load_more:true
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var that = this;
    that.setData({options:options})
    that.getModuleList();
    that.getUserDetail();
  },

  getUserDetail: function () {
    var that = this;
    requestUtil.get(_DuoguanData.duoguan_host_api_url + '/index.php?s=/addon/ServiceCard/Api/getUserDetail', { uid: that.data.options.uid }, (info) => {
      that.setData({ user_detail: info });
    }, this, { isShowLoading: true });

  },

  getModuleList:function(){
    var that = this;
    requestUtil.get(_DuoguanData.duoguan_host_api_url + '/index.php?s=/addon/ServiceCard/Api/getModuleList', { }, (info) => {
      that.setData({ module_list: info });
      that.getModelActive();
    }, this, { isShowLoading: true });
  },

  getModelActive:function(){
    var that = this;
    var class_name = that.data.module_list[that.data.module_index].module;
    var active_name = that.data.module_list[that.data.module_index].active[that.data.active_index].name;
    if (that.data.page_load_more){
      requestUtil.get(_DuoguanData.duoguan_host_api_url + '/index.php?s=/addon/ServiceCard/Api/getModelActive', {
        class_name: class_name,
        active_name: active_name,
        page: that.data.page
      }, (info) => {
        if (info.length > 0) {
          that.setData({ active_info: that.data.active_info.concat(info) });
        }
        if (info.length > 19) {
          that.setData({ page: that.data.page + 1 });
        } else {
          that.setData({ page_load_more: false })
        }
      }, this, { isShowLoading: true });
    }
  },

  openSelect:function(){
    var that = this;
    that.setData({ open_select: !that.data.open_select});
  },

  selectModule:function(e){
    var that = this;
    var module_index = e.currentTarget.dataset.module_index;
    if (module_index != that.data.module_index) that.setData({ active_info: [], page_load_more: true, page:1});
    that.setData({ module_index: module_index });
  },

  selectActive:function(e){
    var that = this;
    var active_index = e.currentTarget.dataset.active_index;
    if (active_index != that.data.active_index) that.setData({ active_info: [], page_load_more: true, page: 1});
    that.setData({ active_index: active_index, open_select: !that.data.open_select });
    that.getModelActive();
  },

  pushTemplate:function(e){
    var that = this;
    var jump_id = e.currentTarget.dataset.jump_id;
    var jump_name = e.currentTarget.dataset.jump_name;
    var jump_url = e.currentTarget.dataset.jump_url;
    var send_content = '是否为' + that.data.user_detail.user_info.nickname + '推送';
    wx.showModal({
      title: '提示',
      content: send_content,
      success(res){
        if (res.confirm){
          requestUtil.get(_DuoguanData.duoguan_host_api_url + '/index.php?s=/addon/ServiceCard/Api/pushTemplate', {
            uid: that.data.options.uid,
            jump_id: jump_id,
            jump_name: jump_name,
            jump_url: jump_url
          }, (info) => {
            if (info == 'success') {
              wx.showToast({
                title: '发送成功',
                icon: 'success',
                duration: 500
              })
            } else {
              wx.showModal({
                title: '提示',
                content: info,
                showCancel: false
              })
            }
          }, this, { isShowLoading: true });
        }
      }
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
    this.getModelActive();
  }
})