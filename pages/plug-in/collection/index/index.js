// pages/plug-in/collection/index/index.js
const app = getApp();
import util from'../../../../utils/util';
import requestUtil from '../../../../utils/requestUtil';
import $ from '../../../../utils/underscore';
import _DuoguanData from '../../../../utils/data';
import WxParse from '../../../../wxParse/wxParse.js';
import plugUtil from '../../../../utils/plugUtil';
import dg from '../../../../utils/dg';

Page({

  /**
   * 页面的初始数据
   */
  data: {
    taskData: [],
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    let that = this;
    wx.hideShareMenu();
    that.setData({
      options: options
    }, function () {
      // util.trySyncUserInfo();//同步用户信息
      that.getTaskData(options);
      wx.stopPullDownRefresh();
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

  getTaskData: function (options) {
    let that = this;
    requestUtil.post(_DuoguanData.duoguan_host_api_url + '/index.php?s=/addon/MarketingTask/IndexApi/index.html', options, (info) => {
      wx.setNavigationBarTitle({
        title: info.title
      })
      wx.setNavigationBarColor({
        frontColor: '#ffffff',
        backgroundColor: info.bj_color,
        animation: {
          duration: 400,
          timingFunc: 'easeIn'
        }
      })
      that.setData({taskData:info})
      WxParse.wxParse('content', 'html', info.task_content, that);
    });
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
    let that = this;
    let options = that.data.options;
    // util.trySyncUserInfo();
    that.setData({ taskData: [], up_status:false})
    that.getTaskData(options);
    wx.stopPullDownRefresh();
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  //显示上传弹框
  toChageUp:function(){
    this.setData({ up_status:true})
  },
  //关闭上传
  toClose:function(){
    this.setData({ up_status: false })
  },

  //选择图片
  chooseimg_bind: function () {
    var that = this;
    that.setData({ is_add_logo: 1 })
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: function (res) {
        var size = res.tempFiles[0].size;//临时路径图片大小
        if (parseInt(size / 1024) > 500){
          dg.alert('上传图片最大500K，请重新选择');
          that.setData({ up_status: false })
          return false;
        }else{
          that.setData({
            this_img: res.tempFilePaths,
          })
        }
        
      }
    })
  },

  //提交
  submitPic: function (e) {
    var that = this;
    if (that.data.this_img == null || that.data.this_img == '') {
      dg.alert('请上传图片'); return false;
    }
    var requsetData = e.detail.value;
    
    requsetData.t_id = that.data.taskData.id;

    requestUtil.post(_DuoguanData.duoguan_host_api_url + '/index.php/addon/MarketingTask/PartakeApi/addLog.html', requsetData, (info) => {
      //图片上传
      that.imgUploadTime(info.utd_id);
    }, that, { isShowLoading: true, completeAfter: function () { that.setData({ up_status: false }); } });
  },

  //上传图片
  imgUploadTime: function (utd_id) {
    var that = this;
    var requsetData = {};
    requsetData.utd_id = utd_id;
    requestUtil.upload(_DuoguanData.duoguan_host_api_url + '/index.php/addon/MarketingTask/PartakeApi/imgUpload.html', that.data.this_img[0], 'file', requsetData, (info) => {
      if (info=='上传成功'){
        that.onPullDownRefresh();
      }
    }, this, {});

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  },

})