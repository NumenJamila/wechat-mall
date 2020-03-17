// pages/integral/integral-order/index.js
import Page2 from '../page2.js';
import { duoguan_host_api_url as API_URL } from "../../../utils/data";
import requestUtil from '../../../utils/requestUtil';
import util from '../../../utils/util';
import dg from '../../../utils/dg';
const WxParse = require('../../../wxParse/wxParse.js');
Page2({

  /**
   * 页面的初始数据
   */
  data: {
    isShowChooseAddress:true,
    receiving_info:{}
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    if (!options.id) {
      wx.showModal({ content: '参数错误！', showCancel: false, });
      return;
    }
    this.data.id = options.id;
    this.startPullDownRefresh();
  },



  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },


  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
    var that = this;
    requestUtil.get(API_URL + "/index.php?s=/addon/DuoguanIntegral/Api/getGoodsDetail.html", { id: this.data.id }, (data) => {
      data.end_time_text = util.format(data.end_time * 1000, 'yyyy-MM-dd');
      this.setData(data);
      WxParse.wxParse('content', 'html', data.instructions, that);
      requestUtil.get(API_URL + "/index.php?s=/addon/Card/CardApi/getMyCardInfo.html", {}, (info) => {
        const hasExchange = !data.is_end_time && (parseFloat(info.score) >= parseFloat(data.sale_price));
        this.setData({ hasExchange: hasExchange });
      });
    }, this, { completeAfter: wx.stopPullDownRefresh });
  },

  /**
    * 选择收货地址
    */
  chooseAddress: function (e) {
    let that = this;
    util.chooseAddress(function (res) {
      if (res.mobile) {
        that.setData({
          receiving_info: { mobile: res.mobile, address: res.all_address, name: res.name },
          isShowChooseAddress:false
        });
      }
    }, true);
  },

  /**
 * 兑换商品
 */
  onExchangeSubmit: function (e) {
    var that = this;
    requestUtil.pushFormId(e.detail.formId);
    let requestData = { id: this.data.id };

    if (this.data.user_delivery_info == 1) {
      let receiving_info = this.data.receiving_info;
      if (receiving_info.mobile && receiving_info.address && receiving_info.name) {
        // 收货地址已经选择
        requestData.mobile = receiving_info.mobile;
        requestData.address = receiving_info.address;
        requestData.name = receiving_info.name;
      } else {
        dg.alert("请先选择收货地址");
        this.setData({ isShowExchangeDialog: true });
        return false;
      }
    }
  
    requestUtil.get(API_URL + "/index.php?s=/addon/DuoguanIntegral/Api/exchangeGoods.html", requestData, (info) => {
      this.setData({ exchange: info });
      var shipping_fee = that.data.shipping_fee * 1
      if (shipping_fee > 0 && that.data.goods_type == 0) {
        that.pay_confirmOrder();
      } else {
        wx.showModal({
          title: '温馨提示',
          content: '恭喜，兑换成功',
          cancelText: '去首页',
          confirmText: '去列表',
          showCancel: true,
          success: function (res) {
            console.log('success',res)
            if (res.cancel) {
              wx.navigateTo({ url: '../integral-mall/index', });
            }else{
              wx.navigateTo({ url: '../integral-record/index', });
            };
            
          },
          fail: function (res) {
            console.log('fail',res)
          }
        })
      }
    });
  },

  pay_confirmOrder: function () {
    var that = this;
    var requestData = {};
    requestData.order_id = that.data.exchange.id;
    requestUtil.post(API_URL + "/index.php?s=/addon/DuoguanIntegral/Api/makePay.html", requestData, (info) => {
      Object.assign(info, {
        'success': function (res) {
          //支付完成 跳转订单列表
          wx.showModal({
            title: '温馨提示',
            content: '恭喜，兑换成功？',
            cancelText: '去首页',
            confirmText: '去列表',
            showCancel: true,
            success: function (res) {
              if (res.cancel) return;
              wx.navigateTo({ url: '../integral-record/index', });
            },
            fail:function(res){
              console.log(res)
            }
          })
        },
        'fail': function (res) {
          //不支付 直接取消订单
          requestUtil.get(API_URL + "/index.php?s=/addon/DuoguanIntegral/Api/cancelOrder.html",requestData,(info)=>{
            console.log('取消订单成功')
          })
        },
        'complete': function () {
          
        }
      });
      wx.requestPayment(info);
    });
  }

})