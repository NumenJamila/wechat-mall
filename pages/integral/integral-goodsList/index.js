// pages/integral/integral-goodsList/index.js
import Page2 from '../page2.js';
import { duoguan_host_api_url as API_URL } from "../../../utils/data";
import requestUtil from '../../../utils/requestUtil';
Page2({

  /**
   * 页面的初始数据
   */
  data: {
    data: [],
    isEmpty: false,//数据是否为空
    hasMore: true,//是否还有更多数据
    isLoading: false,//是否正在加载中
    page: 1,//当前请求的页数
  },
  navigatorMore: function () {
    wx.navigateTo({
      url: '/pages/integral/integral-goodsList/index',
    })
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    console.log(options)
    var that = this;
    that.setData({
      action_name: options.action_name ? options.action_name : 'getNewGoodsList',
    })
    that.startPullDownRefresh();
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
    var that = this;
    var action_name = that.data.action_name;
    requestUtil.get(API_URL + "/index.php?s=/addon/DuoguanIntegral/Api/" + action_name +".html", {type:'list'}, (data) => {
      this.onSetData(data, 1);
    }, this, { completeAfter: wx.stopPullDownRefresh });
  },

	/**
	 * 页面上拉触底事件的处理函数
	 */
  onReachBottom: function () {
    var that = this;
    if (!this.data.hasMore) {
      console.log("没有更多了...");
      wx.stopPullDownRefresh();
      return;
    }
    var action_name = that.data.action_name;
    requestUtil.get(API_URL + "/index.php?s=/addon/DuoguanIntegral/Api/" + action_name + ".html", { _p: this.data.page + 1, type: 'list'}, (data) => {
      this.onSetData(data, this.data.page + 1);
    }, this, { completeAfter: wx.stopPullDownRefresh });
  },
})