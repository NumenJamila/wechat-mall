// pages/integral/integral-record/index.js
import Page2 from '../page2.js';
import {
  duoguan_host_api_url as API_URL,duoguan_app_index_path
} from "../../../utils/data";
import requestUtil from '../../../utils/requestUtil';
import _ from '../../../utils/underscore';
import util from '../../../utils/util';
const QR = require('../../../utils/qrcode');

Page2({

  /**
   * 页面的初始数据
   */
  data: {
    data: [],
    isEmpty: false, //数据是否为空
    hasMore: true, //是否还有更多数据
    isLoading: false, //是否正在加载中
    page: 1, //当前请求的页数
    state: 0, //状态：0待使用，1已完成，2待使用
    ewmTck:true,//弹出框
  },
  ewmClick:function(e){
    var that = this;
    const dataset = e.detail.target ? e.detail.target.dataset : e.currentTarget.dataset;
    const exam_code = dataset.exam_code ? dataset.exam_code :'';
    that.createQrCode(exam_code, 'mycanvas');
    that.setData({
      ewmTck:(!this.data.ewmTck),
      exam_code: exam_code,
    })
  },
  //创建二维码
  createQrCode: function (code, canvasId) {
    var rpx;
    wx.getSystemInfo({
      success: function (res) {
        if (res.windowWidth > 420) {
          rpx = 420 / 375
        } else {
          rpx = res.windowWidth / 375
        }
      },
    })
    //调用插件中的draw方法，绘制二维码图片
    QR.qrApi.init(code, canvasId, 0, 0, 160 * rpx, 160 * rpx);
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    this.startPullDownRefresh();
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function() {
    requestUtil.get(API_URL + "/index.php?s=/addon/DuoguanIntegral/Api/getOrderList.html", {}, (data) => {
      this.onDataHandler(data);
      this.onSetData(data, 1);
    }, this, {
      completeAfter: wx.stopPullDownRefresh
    });
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function() {
    if (!this.data.hasMore) {
      console.log("没有更多了...");
      wx.stopPullDownRefresh();
      return;
    }

    requestUtil.get(API_URL + "/index.php?s=/addon/DuoguanIntegral/Api/getOrderList.html", {
      _p: this.data.page + 1
    }, (data) => {
      this.onDataHandler(data);
      this.onSetData(data, this.data.page + 1);
    }, this, {
      completeAfter: wx.stopPullDownRefresh
    });
  },

  /**
   * 数据处理
   */
  onDataHandler: function(data) {
    _(data).map((item) => {
      item.end_time = util.formatSmartTime(item.end_time * 1000, "yyyy年MM月dd日");
      return item;
    });
  },

  /**
   * 拷贝数据
   */
  onCopyTap: function(e) {
    const dataset = e.currentTarget.dataset,
      index = dataset.index,
      item = this.data.data[index],
      type = dataset.type;
      if (type=='duihuan'){
        var data = item.key
      } else if (type == 'kuaidi'){
        var data = item.courier_number
      }
    wx.setClipboardData({
      data: data ,
      success: function(res) {
        wx.showToast({
          title: '已复制！',
        });
      },
    });
  },

  goIndex: function () {
    var that = this;
    var url = duoguan_app_index_path;
    console.log(url)
    wx.switchTab({
      url: url,
      success: function (res) { },
      fail: function (res) {

      },
      complete: function (res) { },
    })
  }


});