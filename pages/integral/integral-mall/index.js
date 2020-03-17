// pages/integral-mall/index.js
import Page2 from '../page2.js';
import { duoguan_host_api_url as API_URL, duoguan_app_index_path } from "../../../utils/data";
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
  navigatorMore:function(e){
    var that = this;
    const dataset = e.detail.target ? e.detail.target.dataset : e.currentTarget.dataset;
    const action_name = dataset.action_name
    wx.navigateTo({
      url: '/pages/integral/integral-goodsList/index?action_name=' + action_name,
    })
  },
	/**
	 * 生命周期函数--监听页面加载
	 */
    onLoad: function (options) {
        this.startPullDownRefresh();
    },

	/**
	 * 页面相关事件处理函数--监听用户下拉动作
	 */
    onPullDownRefresh: function () {
        requestUtil.get(API_URL + "/index.php?s=/addon/DuoguanUser/CardApi/getInfo.html", {}, (info) => {
            this.setData(info);
        }, this, {
                completeAfter: () => {
                  requestUtil.get(API_URL + "/index.php?s=/addon/DuoguanIntegral/Api/getCouponList.html", {type:'index'}, (data) => {
                    this.setData({
                      couponData:data
                    });
                  }, this, {});
                  requestUtil.get(API_URL + "/index.php?s=/addon/DuoguanIntegral/Api/getNewGoodsList.html", {}, (data) => {
                      this.onSetData(data, 1);
                  }, this, { completeAfter: wx.stopPullDownRefresh });
                }
            });
    },

	/**
	 * 页面上拉触底事件的处理函数
	 */
    onReachBottom: function () {
        if (!this.data.hasMore) {
            console.log("没有更多了...");
            wx.stopPullDownRefresh();
            return;
        }

      requestUtil.get(API_URL + "/index.php?s=/addon/DuoguanIntegral/Api/getNewGoodsList.html", { _p: this.data.page + 1 }, (data) => {
            this.onSetData(data, this.data.page + 1);
        }, this, { completeAfter: wx.stopPullDownRefresh });
    },

	/**
	 * 用户点击右上角分享
	 */
    onShareAppMessage: function () {
        return {
            title: '积分商城',
            path: 'pages/integral/integral-mall/index'
        };
    },
    goIndex:function(){
      var that = this;
      var url = duoguan_app_index_path;
      console.log(url)
      wx.switchTab({
        url: url,
        success: function(res) {},
        fail: function(res) {

        },
        complete: function(res) {},
      })
    }
});