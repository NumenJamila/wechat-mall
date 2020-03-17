// pages/user/userDetail/userDetail.js
const app = getApp();
const requestUtil = require('../../../../utils/requestUtil');
const _DuoguanData = require('../../../../utils/data');
const WxParse = require('../../../../wxParse/wxParse.js');
Page({

  /**
   * 页面的初始数据
   */
  data: {
    topTab: 1,
    user_detail:'',
    user_page: 0,
    user_load_more:true,
    locus_original_list:[],
    locus_list:'',
    show_select: false,
    days: 7,
    show_add_tag:false,
    record_page:1,
    record_load_more:true,
    record_list: '',
    record_original_list:[]
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var that = this;
    that.setData({options:options});
    that.checkServiceStatus();
    that.getUserDetail();
    that.getUserAiLocus();
    that.getAiStatistics();
    // that.getAiRecord();
    that.cheekSendNum();
  },

  cheekSendNum:function(){
    var that = this;
    requestUtil.get(_DuoguanData.duoguan_host_api_url + '/index.php?s=/addon/ServiceCard/Api/cheekSendNum', { accept_uid: that.data.options.uid }, (info) => {
      that.setData({ click_can_send_num: info });
    }, this, { isShowLoading: true });
  },

  checkServiceStatus: function () {
    var that = this;
    requestUtil.get(_DuoguanData.duoguan_host_api_url + '/index.php?s=/addon/ServiceCard/Api/checkServiceStatus', {}, (info) => {
      if (info) {
        that.setData({
          service_card_info: info
        });
      }
    }, this, { isShowLoading: true });
  },

  getUserDetail:function(){
    var that = this;
    requestUtil.get(_DuoguanData.duoguan_host_api_url + '/index.php?s=/addon/ServiceCard/Api/getUserDetail', { uid: that.data.options.uid }, (info) => {
      that.setData({user_detail: info});    
    }, this, { isShowLoading: true });
    
  },

  getUserAiLocus: function () {
    var that = this;
    if (that.data.user_load_more) {
      requestUtil.get(_DuoguanData.duoguan_host_api_url + '/index.php?s=/addon/ServiceCard/Api/getAiLocus', { uid: that.data.options.uid, page: that.data.user_page }, (info) => {
        if (info.length > 0) {
          that.handleArray(info);
        }
        if (info.length > 19) {
          that.setData({ user_page: that.data.user_page + 1 })
        } else {
          that.setData({ user_load_more: false })
        }
      }, this, { isShowLoading: true });
    }
  },

  handleArray: function (info) {
    var that = this;
    var original_list = that.data.locus_original_list.concat(info);
    var list = {};
    var key = '';
    for (var i = 0; i < original_list.length; i++) {
      if (original_list[i]['locus_time_day'] != key) {
        key = original_list[i]['locus_time_day'];
        list[key] = [];
      }
      list[key].push(original_list[i]);
    }
    that.setData({
      locus_original_list: original_list,
      locus_list: list
    })
  },
  
  getAiStatistics: function () {
    var that = this;
    requestUtil.get(_DuoguanData.duoguan_host_api_url + '/index.php?s=/addon/ServiceCard/Api/getAiStatistics', { uid: that.data.options.uid, days: that.data.days }, (info) => {
      that.setData({ statistics_data: info })
    }, this, { isShowLoading: true });
  },

  showSelect: function () {
    var that = this;
    that.setData({ show_select: !that.data.show_select });
  },

  selectDays: function (e) {
    var that = this;
    var days = e.currentTarget.dataset.days;
    that.setData({ days: days, show_select: false })
    that.getAiStatistics();
  },

  getAiRecord:function(){
    var that = this;
    if (that.data.record_load_more) {
      requestUtil.get(_DuoguanData.duoguan_host_api_url + '/index.php?s=/addon/ServiceCard/Api/getAiRecord', { uid: that.data.options.uid, page: that.data.record_page }, (info) => {
        if (info.length > 0) {
          that.handleRecordArray(info);
        }
        if (info.length > 19) {
          that.setData({ record_page: that.data.record_page + 1 })
        } else {
          that.setData({ record_load_more: false })
        }
      }, this, { isShowLoading: true });
    }
  },

  handleRecordArray:function(info){
    var that = this;
    var original_list = that.data.record_original_list.concat(info);
    var list = {};
    var end_list;
    var key = '';
    var end_key = '';
    for (var i = 0; i < original_list.length; i++) {
      if (original_list[i]['record_time_day'] != key) {
        key = original_list[i]['record_time_day'];
        list[key] = {};
      }
      list[key][original_list[i]['nickname']] = {};
      list[key][original_list[i]['nickname']].list = [];
      list[key][original_list[i]['nickname']].show = false;
    }
    end_list = list;
    for(var j in list){
      for(var k in list[j]){
        for (var g = 0; g < original_list.length; g++){
          if (j == original_list[g]['record_time_day'] && k == original_list[g]['nickname']){
            end_list[j][k].list.push(original_list[g]);
          }
        }
      }
    }
    that.setData({
      record_original_list: original_list,
      record_list: end_list
    })
  },

  recordShow:function(e){
    var that = this;
    var one = e.currentTarget.dataset.one;
    var two = e.currentTarget.dataset.two;
    var record_list = that.data.record_list;
    record_list[one][two].show = !record_list[one][two].show;
    that.setData({record_list: record_list});
  },

  show_add_tag:function(){
    var that = this;
    that.setData({show_add_tag: !that.data.show_add_tag})
  },

  setTags:function(e){
    var that = this;
    var tag = e.detail.value.tag;
    if(!tag || tag.length > 20){
      wx.showModal({
        title: '提示',
        content: '标签不能为空或长度大于20',
        showCancel: false
      });
      return;
    }
    requestUtil.get(_DuoguanData.duoguan_host_api_url + '/index.php?s=/addon/ServiceCard/Api/setUserTags', { uid: that.data.options.uid, tag: tag }, (info) => {
      if(info == 'success'){
        wx.showModal({
          title: '提示',
          content: '新增标签成功',
          showCancel: false
        });
        that.setData({ show_add_tag: !that.data.show_add_tag });
        that.getUserDetail();
      }else{
        wx.showModal({
          title: '提示',
          content: info,
          showCancel: false
        });
      }
    }, this, { isShowLoading: true });
  },

  sendCard:function(){
    var that = this;
    if (this.data.click_can_send_num < 1) {
      wx.showModal({
        title: '提示',
        content: '超出发送上限',
      });
      return;
    }
    var send_content = '是否为' + that.data.user_detail.user_info.nickname + '发送名片';
    wx.showModal({
      title: '提示',
      content: send_content,
      success(res) {
        if (res.confirm) {
          requestUtil.get(_DuoguanData.duoguan_host_api_url + '/index.php?s=/addon/ServiceCard/Api/sendCard', { uid: that.data.user_detail.user_info.uid }, (info) => {
            if (info == 'success') {
              wx.showToast({
                title: '发送成功',
                icon: 'success',
                duration: 500
              });
              that.cheekSendNum();
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
  // tab切换
  toptabTap: function (e) {
    var that = this;
    var id = e.currentTarget.dataset.id;
    that.setData({
      topTab: id
    })
    if (that.data.topTab == 3){
      that.setData({ 
        record_load_more: true,
        record_list:'',
        record_original_list:[]
        });
      that.getAiRecord();
    }
  },
  // 页面跳转
  linkToTap: function (e) {
    if (this.data.click_can_send_num < 1) {
      wx.showModal({
        title: '提示',
        content: '超出发送上限',
      });
      return;
    }
    var url = e.currentTarget.dataset.url;
    wx.navigateTo({
      url: url,
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
    var that = this;
    if (that.data.topTab == 1) {
      that.getUserAiLocus();
    }else if(that.data.topTab == 3){
      that.getAiRecord();
    }
  }
})