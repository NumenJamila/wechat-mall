// pages/plug-in/components/collect/index.js
var app = getApp();
var requestUtil = require('../../../../utils/requestUtil');
var _DuoguanData = require('../../../../utils/data');
Component({
  /**
   * 组件的属性列表
   */
  properties: {

  },

  /**
   * 组件的初始数据
   */
  data: {
    is_collect:true
  },
  pageLifetimes:{
    show:function(){
      var that = this;
      var launch_options = wx.getLaunchOptionsSync();
      if (launch_options.scene == 1089) {
        that.setData({ is_collect: true })
      } else {
        wx.checkSession({
          success() {
            that.setData({ is_collect: true })
          },
          fail() {
            that.setData({ is_collect: false })
            that.getCollectStatus()
          }
        })
      }
    }
  },

  /**
   * 组件的方法列表
   */
  methods: {
    closeCollect: function () {
      var that = this;
      that.setData({ is_collect: true });
    },
    getCollectStatus: function () {
      var that = this;
      requestUtil.get(_DuoguanData.duoguan_host_api_url + '/index.php/addon/Card/CardApi/getAppConfigByAppId.html', {}, (info) => {
        that.setData({
          collect_status: info.collect_status,
          collect_msg: info.collect_msg ? info.collect_msg :'添加到我的小程序，微信首页下拉即可快速访问店铺'
        })
      }, this);
    }
  }
})
