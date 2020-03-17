// pages/shop/reminder/index.js
const _DuoguanData = require('../../../utils/data');
const requestUtil = require('../../../utils/requestUtil');
Page({

  /**
   * 页面的初始数据
   */
  data: {
    order_info: '',
    cart_num: '',
    order_page: 0, //订单数据的初始页数
    order_max_page: 20, //最多加载20页
    order_goods: [], //对应的订单商品数据
    my_check_box: [{
      name: 'is_my',
      value: '我购买的'
    }],
    pay_and_have_gift_record:{
      show_current_order:0,
      show_recent_order:0
    }
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    var that = this;
    requestUtil.get(_DuoguanData.duoguan_host_api_url + '/index.php?s=/addon/DuoguanShop/Api/getCommunityConfig.html', {}, (info) => {
      that.setData({
        community_config: info
      })
    }, that, {
      isShowLoading: false
    });
    that.setData({
      order_id: options.order_id,
      self_address_id: options.self_address_id,
      colonel_uid: options.colonel_uid
    })
    //获取分享页必须的数据信息
    that.get_reminder_pages_data()
    // that.getOrderInfo(options.order_id);
    that.getCarListNum();

  },
  /**
   * 获取分享页所需的数据
   */
  get_reminder_pages_data: function() {
    let that = this
    requestUtil.get(_DuoguanData.duoguan_host_api_url + '/index.php?s=/addon/DuoguanShop/PayAndHaveGiftApi/get_reminder_pages_data.html', {
      order_id: that.data.order_id
    }, (info) => {
      console.log('33333', info)
      that.setData({
        labels: info.labels,
        pay_and_have_gift_record: info.pay_and_have_gift_record,
        order:info.order
      })
    }, that, {
      isShowLoading: false
    });
  },
  /**
   * 获取分享页订单对应的商品(分页,每页十条订单数据)
   */
  get_order_goods: function(order_id, order_page, is_my = 0) {
    let that = this
    if (order_page >= that.data.order_max_page) {
      wx.showToast({
        title: '只能加载200单哦~',
        icon: 'none',
        duration: 2500
      })
      return
    }
    //获取下最后一条数据的id
    let begin_id = 0
    if (that.data.order_goods.length > 0) {
      begin_id = that.data.order_goods[that.data.order_goods.length - 1]['order_id']
    }
    console.log(begin_id)
    requestUtil.get(_DuoguanData.duoguan_host_api_url + '/index.php?s=/addon/DuoguanShop/OrderApi/get_recent_pay_order_goods.html', {
      order_id: order_id,
      order_page: order_page,
      begin_id: begin_id,
      is_my: is_my
    }, (info) => {
      console.log('获取订单信息', info)
      //拿到后端返回的商品信息
      let goods_data = info
      //若有数据则追加到订单数据中
      if (goods_data.length > 0) {
        //追加数据
        that.setData({
          order_goods: that.data.order_goods.concat(goods_data),
          //页码赋值为更新为+1后的页码
          order_page: order_page
        })
      } else {
        //若后台关闭-则不进行弹框
        if(that.data.pay_and_have_gift_record.show_recent_order ==1){
          wx.showToast({
            title: '没有更多数据了',
            icon: 'none',
            duration: 2000
          })
        }
      }
    }, that, {
      isShowLoading: false
    });
  },
  getOrderInfo: function(order_id) {
    var that = this;
    requestUtil.get(_DuoguanData.duoguan_host_api_url + "/index.php?s=/addon/DuoguanShop/OrderApi/orderInfo.html", {
      oid: that.data.order_id,
      type: 2
    }, (info) => {
      that.setData({
        order_info: info
      })
    }, this, {});
  },

  //进入购物车
  bind_go_cart: function() {
    wx.navigateTo({
      url: '../mallcart/mallcart'
    })
  },

  bind_go_index: function() {
    wx.switchTab({
      url: _DuoguanData.duoguan_app_index_path
    })
  },

  goGoodsInfo: function(e) {
    var that = this;
    if (that.data.community_config.is_open == 1) {
      wx.navigateTo({
        url: '/pages/shop/malldetail/malldetail?sid=' + e.currentTarget.id + '&self_address_id=' + that.data.self_address_id + '&colonel_uid=' + that.data.colonel_uid,
      })
    } else {
      wx.navigateTo({
        url: '/pages/shop/malldetail/malldetail?sid=' + e.currentTarget.id,
      })
    }
  },

  getCarListNum: function() {
    var that = this;
    requestUtil.get(_DuoguanData.duoguan_host_api_url + '/index.php?s=/addon/DuoguanShop/DuoguanShopApi/getCartList.html', {},
        (data) => {
          var cart_num = 0;
          if (data) {
            for (var i = 0; i < data.length; i++) {
              cart_num += data[i].goods_number * 1
            }
          }
          that.setData({
            cart_num: cart_num
          })
        }, that, {
          isShowLoading: false
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
    let lunch_options = wx.getLaunchOptionsSync()

    let that = this
    console.log('show', lunch_options.scene, that.data)
    //判断场景值是否是群
    if (lunch_options.scene == 1008) {
      //更新订单状态为2
      requestUtil.post(_DuoguanData.duoguan_host_api_url + '/index.php?s=/addon/DuoguanShop/OrderApi/alter_share_status.html', {
        order_id: that.data.order_id,
        share_status: 2
      }, (info) => {
        //获取初始的订单-商品数据
        that.get_order_goods(that.data.order_id, 1)
      }, that, {
        isShowLoading: false
      });
    }else{
      //获取初始的订单-商品数据
      that.get_order_goods(that.data.order_id, 1)
    }
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

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function() {
    console.log('onReachBottom')
    // 判断一下是否只查自己的
    if (this.data.my_check_box[0].checked) {
      this.get_order_goods(this.data.order_id, this.data.order_page + 1, 1)
    } else {
      this.get_order_goods(this.data.order_id, this.data.order_page + 1)
    }

  },
  /**
   * 评价标签用户点击事件
   */
  label_click: function(e) {
    console.log('label_click', e)
    let that = this
    // 取出id
    let id = e.currentTarget.dataset.id
    // 取出用户点击标识
    let clicked = e.currentTarget.dataset.clicked
    //进行点击
    if (!clicked) {
      requestUtil.get(_DuoguanData.duoguan_host_api_url + '/index.php?s=/addon/DuoguanShop/PayAndHaveGiftApi/click_comment_label.html', {
        label_id: id
      }, (info) => {
        console.log(info)
        let labels = that.data.labels.map(function(e) {
          if (e.id == id) {
            e.clicked = true
            e.click_count = parseInt(e.click_count) + 1
          }
          return e
        });
        that.setData({
          labels: labels
        })
      }, that, {
        isShowLoading: false
      });

    } else {
      wx.showToast({
        title: '今天已经点过啦~',
        icon: 'none',
        duration: 2000
      })
    }
  },
  /**
   * 复制微信号
   */
  copy_wechat: function() {
    let that = this
    wx.setClipboardData({
      data: that.data.pay_and_have_gift_record.wechat,
      success(res) {
        wx.getClipboardData({
          success(res) {
            wx.showToast({
              title: '复制成功',
              icon: 'success',
              duration: 2000
            })
          }
        })
      }
    })
  },
  /**
   * 跳转到对应商品详情页
   */
  go_goods: function(e) {
    let that = this
    //拿到id
    let id = e.currentTarget.dataset.id
    //拿到是否在线标识
    let is_sale = e.currentTarget.dataset.is_sale

    if (is_sale) {
      if (that.data.community_config.is_open == 1) {
        wx.navigateTo({
          url: '/pages/shop/malldetail/malldetail?sid=' + id + '&self_address_id=' + that.data.self_address_id + '&colonel_uid=' + that.data.colonel_uid,
        })
      } else {
        wx.navigateTo({
          url: '/pages/shop/malldetail/malldetail?sid=' + id,
        })
      }
    } else {
      wx.showModal({
        title: '提示',
        content: '该商品已断货，去看看其他商品吧',
        success(res) {
          if (res.confirm) {
            wx.switchTab({
              url: _DuoguanData.duoguan_app_index_path
            })
          } else if (res.cancel) {

          }
        }
      })
    }
  },
  my_check_box_change: function(e) {
    //取出我的订单选中状态
    let is_my = e.detail.value[0]
    console.log(is_my)
    //设置选中状态
    let my_check_box = this.data.my_check_box
    if (is_my == 'is_my') {
      my_check_box[0].checked = true
      //重置当前页码，请求我的订单数据
      this.setData({
        order_page: 0,
        order_goods: []
      })
      //请求我的订单
      this.get_order_goods(this.data.order_id, this.data.order_page + 1, 1)
    } else {
      my_check_box[0].checked = false
      //重置当前页码，请求我的订单数据
      this.setData({
        order_page: 0,
        order_goods: []
      })
      //请求我的订单
      this.get_order_goods(this.data.order_id, this.data.order_page + 1)
    }
    console.log(my_check_box)
    this.setData({
      my_check_box: my_check_box
    })
  },
  /**
   * 跳转到订单详情页
   */
  go_goods_detail:function(e){
    let dataset = e.currentTarget.dataset
    //取出商品id
    let goods_id = dataset.id
    //跳转到订单详情页
    wx.navigateTo({
      url: '/shop/shop/malldetail/malldetail?sid=' + goods_id+'&self_address_id=',
    })
  }
})