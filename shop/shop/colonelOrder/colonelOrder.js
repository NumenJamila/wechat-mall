const _function = require('../../../utils/functionData.js');
const requestUtil = require('../../../utils/requestUtil');
const _DuoguanData = require('../../../utils/data');
const app = getApp()
Page({
  data: {
    postlist: [],
    this_weiba_id: 0,
    hasMore: false,
    showLoading: false,
    isScrollY: true,
    this_page: 1,//当前页码
    pagesize: 10,//每页数量
    this_nav_name: 'index',
    this_is_jinghua: 0,
    this_finish_page: 0,
    glo_is_load: true,
    group_val: 'all',
    version: '2.2.2',
    refund: false,
    show_more:false,
    inpValue:''
  },
  //订单详情
  // user_orderinfo_bind: function (e) {
  //   var that = this;
  //   console.log(e)
  //   var index = e.currentTarget.dataset.num;
  //   if (that.data.postlist[index].refund_state) {
  //     wx.navigateTo({
  //       url: '../../refundDetail/refundDetail?rid=' + that.data.postlist[index].rid
  //     })
  //     return;
  //   }
  //   var oid = e.currentTarget.id;
  //   wx.navigateTo({
  //     url: '../info/index?oid=' + oid
  //   })
  // },
  group_show: function (e) {
    var that = this;
    if (e.target.dataset.val == 'search'){
      that.setData({
        this_page: 1,
        refund: false
      })
    }else{
      that.setData({
        group_val: e.target.dataset.val,
        this_page: 1,
        refund: false
      })
    }
    requestUtil.get(_DuoguanData.duoguan_host_api_url + '/index.php?s=/addon/DuoguanShop/CommunityDoApi/getColonelOrderList.html',
      { pagesize: that.data.this_page, pagenum: that.data.group_val, version: that.data.version, key_word: that.data.inpValue},
      (data) => {
        that.initUserOrderListData(data)
      }, this, { isShowLoading: false });
    setTimeout(() => {
      wx.stopPullDownRefresh()
    }, 1000)
  },
  onShow: function () {
    var that = this
    that.setData({
      this_page: 1
    })
    if (that.data.refund) {
      requestUtil.get(_DuoguanData.duoguan_host_api_url + '/index.php?s=/addon/DuoguanShop/CommunityDoApi/getRefundOrderList.html',
        { pagesize: that.data.this_page, key_word: that.data.inpValue },
        (data) => {
          that.initUserOrderListData(data)
        }, this, { isShowLoading: false });
    } else {
      requestUtil.get(_DuoguanData.duoguan_host_api_url + '/index.php?s=/addon/DuoguanShop/CommunityDoApi/getColonelOrderList.html',
        { pagesize: that.data.this_page, pagenum: that.data.group_val, version: that.data.version, key_word: that.data.inpValue },
        (data) => {
          that.initUserOrderListData(data)
        }, this, { isShowLoading: false });
    }
  },
  initUserOrderListData: function (data) {
    var that = this
    that.setData({
      postlist: data,
      glo_is_load: false
    })
    if (data == null) {
      that.setData({
        isScrollY: false,
        showLoading: false
      })
    } else {
      if (data.length >= that.data.pagesize) {
        that.setData({
          isScrollY: true,
          showLoading: true
        })
      } else {
        that.setData({
          isScrollY: false,
          showLoading: false
        })
      }
    }
  },
  //下拉刷新
  onPullDownRefresh: function () {
    // wx.startPullDownRefresh();
    var that = this
    that.setData({
      this_page: 1
    })
    if (that.data.refund) {
      requestUtil.get(_DuoguanData.duoguan_host_api_url + '/index.php?s=/addon/DuoguanShop/CommunityDoApi/getRefundOrderList.html',
        { pagesize: that.data.this_page, key_word: that.data.inpValue },
        (data) => {
          that.initUserOrderListData(data)
        }, this, { isShowLoading: false });
    } else {
      requestUtil.get(_DuoguanData.duoguan_host_api_url + '/index.php?s=/addon/DuoguanShop/CommunityDoApi/getColonelOrderList.html',
        { pagesize: that.data.this_page, pagenum: that.data.group_val, version: that.data.version, key_word: that.data.inpValue },
        (data) => {
          that.initUserOrderListData(data)
        }, this, { isShowLoading: false });
    }
    setTimeout(() => {
      wx.stopPullDownRefresh()
    }, 1000)
  },
  //滚动加载
  indexscrolltolower: function () {
    var that = this
    var this_target = this.data.this_items
    if (that.data.this_finish_page != that.data.this_page) {
      requestUtil.get(_DuoguanData.duoguan_host_api_url + '/index.php?s=/addon/DuoguanShop/CommunityDoApi/getColonelOrderList.html',
        { pagesize: that.data.this_page + 1, pagenum: that.data.group_val, version: that.data.version, key_word: that.data.inpValue },
        (data) => {
          that.initUserOrderListLoadData(data)
        }, this, { isShowLoading: false });
    }
  },
  initUserOrderListLoadData: function (data) {
    var that = this
    if (data == null) {
      that.setData({
        isScrollY: false,
        showLoading: false
      })
    } else {
      if (data.length >= that.data.pagesize) {
        that.setData({
          isScrollY: true,
          showLoading: true
        })
      } else {
        that.setData({
          isScrollY: false,
          showLoading: false
        })
      }
      that.setData({
        postlist: that.data.postlist.concat(data),
        this_page: that.data.this_page + 1
      })
    }
    that.setData({
      this_finish_page: that.this_finish_page + 1
    })
  },
  refund_show: function () {
    var that = this;
    that.setData({ refund: true, group_val: '', this_page: 1 })
    requestUtil.get(_DuoguanData.duoguan_host_api_url + '/index.php?s=/addon/DuoguanShop/CommunityDoApi/getRefundOrderList.html',
      { pagesize: that.data.this_page, key_word: that.data.inpValue },
      (data) => {
        that.initUserOrderListData(data)
      }, this, { isShowLoading: false });
  },

  //支付
  // order_go_pay_bind: function (e) {
  //   var order_id = e.target.id;
  //   wx.redirectTo({
  //     url: '../../../shop/orderpay/index?order_id=' + order_id
  //   })
  // },

  sendForm:function(e){
    var that = this;
    requestUtil.get(_DuoguanData.duoguan_host_api_url + '/index.php?s=/addon/DuoguanShop/CommunityDoApi/sendMessage.html',
      {order_id: e.detail.value.order_id},
      (data) => {
        wx.showModal({
          title: '提示',
          content: '通知成功',
          showCancel: false
        })
      }, this, { isShowLoading: false });
  },

  colonelReplaceTakeOver:function(e){
    var that = this;
    requestUtil.get(_DuoguanData.duoguan_host_api_url + '/index.php?s=/addon/DuoguanShop/CommunityDoApi/colonelReplaceTakeOver.html',
      { order_id: e.detail.value.order_id },
      (data) => {
        wx.showModal({
          title: '提示',
          content: '收货成功',
          showCancel: false
        });
        that.onPullDownRefresh();
      }, this, { isShowLoading: false });
  },

  showMore:function(){
    var that = this;
    this.setData({show_more: !this.data.show_more});
  },

  onReachBottom: function (e) {
    var that = this;
    // var formid = e.detail.formId;
    // requestUtil.pushFormId(formid);//收集formid处理
    var this_target = this.data.this_items
    if (that.data.this_finish_page != that.data.this_page) {
      if (that.data.refund) {
        requestUtil.get(_DuoguanData.duoguan_host_api_url + '/index.php?s=/addon/DuoguanShop/CommunityDoApi/getRefundOrderList.html',
          { pagesize: that.data.this_page + 1, key_word: that.data.inpValue },
          (data) => {
            that.initUserOrderListLoadData(data)
          }, this, { isShowLoading: false });
      } else {
        requestUtil.get(_DuoguanData.duoguan_host_api_url + '/index.php?s=/addon/DuoguanShop/CommunityDoApi/getColonelOrderList.html',
          { pagesize: that.data.this_page + 1, pagenum: that.data.group_val, version: that.data.version, key_word: that.data.inpValue },
          (data) => {
            that.initUserOrderListLoadData(data)
          }, this, { isShowLoading: false });
      }
    }
  },
  // 输入框输入
  bindInputTap: function (e) {
    let that = this;
    let val = e.detail.value;
    that.setData({
      inpValue: val
    })
  },
  // 清空输入框
  clearInputTap: function () {
    console.log(1);
    let that = this;
    that.setData({
      inpValue: ''
    })
  },
})