// pages/user/fen/index/index.js
const app = getApp();
const requestUtil = require('../../../../utils/requestUtil');
const _DuoguanData = require('../../../../utils/data');
Page({

  /**
   * 页面的初始数据
   */
  data: {
    fxinfo: [],
    grade_info: {status:0}
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    var that = this
    requestUtil.get(_DuoguanData.duoguan_host_api_url + '/index.php?s=/addon/DuoguanUser/DistributionApi/getApplyStatus.html', {}, (info) => {
      if (info.status != 200) {
        wx.redirectTo({
          url: '../distribution/index'
        })
      }
    }, {});
    that.getfxData()
  },

  //获取数据
  getfxData: function() {
    var that = this
    requestUtil.get(_DuoguanData.duoguan_host_api_url + '/index.php?s=/addon/DuoguanUser/DistributionApi/fenxiao', {}, (info) => {
      that.setData({
        fxinfo: info
      })
    }, this, {
      isShowLoading: true
    });
    that.checkDistributionGrade();
  },

  checkDistributionGrade: function() {
    var that = this;
    requestUtil.get(_DuoguanData.duoguan_host_api_url + '/index.php?s=/addon/DuoguanUser/DistributionApi/checkDistributionGrade', {}, (info) => {
      that.setData({
        grade_info: info
      })
    }, this, {
      isShowLoading: true
    });
  },

  navigatoUrl:function(e){
    let that = this;
    let template_id = [that.data.fxinfo.distribution_config.subscribe_profit_tid];
    wx.requestSubscribeMessage({
      tmplIds: template_id,
      success(res) {
        console.log('success', res);
      },
      fail(res) {
        console.log('fail', res);
      },
      complete(res) {
        console.log('complete', res);
        wx.navigateTo({
          url: e.currentTarget.dataset.url,
        })
      }
    });
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function() {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function() {
    var that = this
    that.getfxData()
    setTimeout(() => {
      wx.stopPullDownRefresh()
    }, 1000)
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function() {

  }
})