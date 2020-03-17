// pages/user/share/index.js
const app = getApp();
const util = require('../../../utils/util');
const requestUtil = require('../../../utils/requestUtil');
const $ = require('../../../utils/underscore');
const _DuoguanData = require('../../../utils/data');
const QQMapWX = require('../../../utils/qqmap-wx-jssdk.min.js');// 引入SDK核心类
const qqmapsdk = new QQMapWX({ key: '7DWBZ-XEW6R-HGGWQ-WZYXJ-FZUAV-MBBDY' });// 实例化API核心类
const WxParse = require('../../../wxParse/wxParse.js');
function GetLength(str) {
  return str.replace(/[\u0391-\uFFE5]/g, "aa").length;
};
Page({

  /**
   * 页面的初始数据
   */
  data: {
    loadhide: true,
    canvasHiden: false,
    sharinfo:[],
    signRules: false,
    sign_success_model:false,
    continue_sign:false,
    sign_continue_model:false,
    getPoint:false,
    week: 1, //第几天，从0开始计算
    progress: [9, 20, 38, 50, 62, 78, 100],
    can_is_hidden:false,
    is_show_sign : false,
    is_show_baibao_button: true,
    is_show_haibao:false

  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
  },
  onShow: function (e){
    var that = this;
    
    requestUtil.get(_DuoguanData.duoguan_host_api_url + '/index.php?s=/addon/DuoguanUser/Api/getOtherConfig.html', {}, (data) => {
      if (data.is_show_sign == true) {
        that.getSignData()
      }else{
        //获取分享网页面的数据
        wx.getLocation({
          type: 'gcj02',
          success(res) {
            console.log('res', res)
            qqmapsdk.reverseGeocoder({
              location: {
                latitude: res.latitude,
                longitude: res.longitude
              },
              success: function (addressRes) {
                console.log('addressRes', addressRes)
                var county = addressRes.result.address_component.nation
                var province = addressRes.result.address_component.province
                var city = addressRes.result.address_component.city
                var district = addressRes.result.address_component.district
                that.setData({
                  district: district
                })
                var requestData = {};
                requestData.county = county;
                requestData.province = province;
                requestData.city = city;
                requestUtil.get(_DuoguanData.duoguan_host_api_url + '/index.php?s=/addon/DuoguanUser/Api/share.html', requestData, (data) => {
                  that.initData(data);
                }, this, { isShowLoading: false })
              }
            })
          },
          fail(res) {
            wx.showModal({
              title: '获取位置失败',
              content: '请先开启您的位置授权',
              showCancel: false,
              success: (res) => {
                wx.navigateTo({
                  url: '/pages/user/setting/index'
                })
              }
            })
          }
        })
      }
      that.setData({
        is_show_sign: data.is_show_sign == true ? true : false
      })
    }, this, { isShowLoading: false })
  },
  getShareInfo:function(){
    wx.showLoading({
      title: '加载中',
    })
    var that = this;
    //获取分享网页面的数据
    wx.getLocation({
      type: 'gcj02',
      success(res) {
        console.log('res', res)
        qqmapsdk.reverseGeocoder({
          location: {
            latitude: res.latitude,
            longitude: res.longitude
          },
          success: function (addressRes) {
            console.log('addressRes', addressRes)
            var county = addressRes.result.address_component.nation
            var province = addressRes.result.address_component.province
            var city = addressRes.result.address_component.city
            var district = addressRes.result.address_component.district
            that.setData({
              district: district
            })
            var requestData = {};
            requestData.county = county;
            requestData.province = province;
            requestData.city = city;
            requestUtil.get(_DuoguanData.duoguan_host_api_url + '/index.php?s=/addon/DuoguanUser/Api/share.html', requestData, (data) => {
              that.initData(data);
            }, this, { isShowLoading: false })
          }
        })
      },
      fail(res) {
        wx.showModal({
          title: '获取位置失败',
          content: '请先开启您的位置授权',
          showCancel: false,
          success: (res) => {
            wx.navigateTo({
              url: '/pages/user/setting/index'
            })
          }
        })
      }
    })
  },
  getSignData:function(){
    var that = this;
    var requestData = {};
    requestUtil.get(_DuoguanData.duoguan_host_api_url + '/index.php?s=/addon/Sign/Api/getSignData.html', requestData, (data) => {
      that.initSignData(data);
      that.setData({
        loadhide: false
      })
    }, this, { isShowLoading: false })  
  },
  initSignData: function (data){
    var that = this;
    var day_is_sign = false
    for(var i = 1;i<=7;i++){
      if (data.week_date[i].can_sign == true){
        day_is_sign= true;
      }
    }
    this.setData({
      week_date: data.week_date,
      sign_config: data.sign_config,
      continue_days: data.continue_days,
      sign_remind: data.sign_remind,
      week: that.data.progress[data.week],
      day_is_sign: day_is_sign
    })
    //设置页面标题
    if (data.sign_config.status==1){
      wx.setNavigationBarTitle({
        title: '签到'
      })
    }
    WxParse.wxParse('content', 'html', data.sign_config.rules, that);
  },
  signRemind:function(e){
    var that = this;
    var requestData = {};
    requestUtil.get(_DuoguanData.duoguan_host_api_url + '/index.php?s=/addon/Sign/Api/signRemind.html', requestData, (data) => {
      console.log(data);
    }, this, { isShowLoading: false })
  },
  userSign:function(e){
    var that = this;
    var template_message = that.data.sign_config.template_message
    wx.requestSubscribeMessage({
      tmplIds: [template_message],
      success(res) {
        console.log('订阅消息成功', res);
      },
      fail(res) {
        console.log('订阅消息失败', res);
      },
      complete(res) {

        if (that.requestUserSignId) return
        // that.setData({
        //   day_is_sign:false
        // })
        requestUtil.pushFormId(e.detail.formId);
        var week_date = that.data.week_date;
        for (var i = 1; i <= 7; i++) {
          if (week_date[i].can_sign == true) {
            var index = i;
            var can_sign = week_date[i].can_sign;
          }
        }
        if (can_sign == false || can_sign == undefined) return;
        if (index == undefined) return;
        var requestData = {};
        that.requestUserSignId = requestUtil.get(_DuoguanData.duoguan_host_api_url + '/index.php?s=/addon/Sign/Api/userSign.html', requestData, (data) => {
          if (data.status == 0) {
            wx.showToast({
              title: data.msg,
              icon: 'none',
              duration: 2000
            })
            return;
          }
          that.setSignData(index, data)
        }, this, { isShowLoading: false })

      }
    })

    
  },
  setSignData:function(index,data){
    var that = this;
    var week_date = that.data.week_date;
    week_date[index].can_sign = false;
    week_date[index].str = '已签到';
    var continue_days = that.data.continue_days*1 + 1;
    that.setData({
      week_date:week_date,
      sign_success_model:true,
      continue_days: continue_days,
      day_is_sign:false
    })
    
    that.timerId = setTimeout(function(){
      console.log('data',data)
      if (data.continue_reward!= undefined){
        if (data.continue_reward.length==0){
          wx.showToast({
            title: '优惠券已经领完啦！',
            icon: 'none',
            duration: 2000
          })
          that.setData({
            sign_success_model: false
          })
          return;
        }
        that.setData({
          sign_success_model:false,
          sign_continue_model:true,
          continue_reward: data.continue_reward,
        })
        that.timerId2 = setTimeout(function(){
          that.setData({
            sign_continue_model: false,
          })
        },2000)
      }else{
        that.setData({
          sign_success_model: false,
        })
      }
    },3000)
  },
  onUnload:function(){
    clearTimeout(timerId)
    clearTimeout(timerId2)
  },
  signRules: function () {
    this.setData({
      signRules: (!this.data.signRules)
    })
  },
  signSuccessModel:function(){
    this.setData({
      sign_success_model: (!this.data.sign_success_model)
    })
  },

  initData:function(data){

    var that = this;
    that.setData({
      sharinfo: data,
      is_show_haibao:true
    })
    //获取二维码
    const url = _DuoguanData.duoguan_host_api_url + "/index.php?s=/addon/DuoguanUser/Api/FXIndexCode.html&&token=" + _DuoguanData.duoguan_user_token + "&_r=" + (new Date().getTime()) + "&path=" + _DuoguanData.duoguan_app_index_path + "&utoken=" + wx.getStorageSync("utoken") +'&version=2.0.0';
    wx.getImageInfo({
      src: url,
      success: (res) => {
        wx.hideToast();
        that.setData({ qr_code: res.path });
        //下载图片
        wx.downloadFile({
          url: that.data.sharinfo.headimgurl,
          success:function(res){
            that.data.sharinfo.headimgurl = res.tempFilePath
            wx.downloadFile({
              url: 'https://xrs.ixiaochengxu.cc/2019-08-28_5d663f131c842.png',
              success: function(res){
                that.data.sharinfo.canvasImg = res.tempFilePath
                wx.downloadFile({
                  url: 'https://xrs.ixiaochengxu.cc/2019-08-28_5d6638baec918.png',
                  success:function(res){
                    that.data.sharinfo.canvasImg2 = res.tempFilePath
                    that.canvasposter();
                  }
                })
              }
            })
            
          }
        })
        
      },
      fail: function (res) {
        console.error(res);
      },
      complete: function (res) {
        console.log(res)
      }
    });
    that.canvasposter();
  },

  canvasposter:function(){
    var rpx;
    var that = this;
    // 判断
    var jitang = that.data.sharinfo.jitang;
    var text = jitang ; //这是要绘制的文本
    var textLength = text.length
    var moreHang = Math.ceil(textLength / 12) - 2
    var moreHeight = moreHang * 16
    wx.getSystemInfo({
      success: function (res) {
        if (res.windowWidth > 420) {
          rpx = 420 / 375
        } else {
          rpx = res.windowWidth / 375
        }
        that.setData({
          height: 1030 + moreHeight*2
        })
      },
    })
    var mc = wx.createCanvasContext("my-canvas", this)

    // 整体背景图
    mc.setFillStyle('white')
    var height = this.data.height
    mc.fillRect(0, 0, 375 * rpx, height * rpx)
    // 内容背景图
    mc.lineJoin = "round";
    mc.setFillStyle('white')
    mc.fillRect(15 * rpx, 15 * rpx, 345 * rpx, (480 + moreHeight) * rpx)
    // 边框
    mc.setStrokeStyle('#CBAA8F')
    mc.strokeRect(15 * rpx, 15 * rpx, 345 * rpx, (480 + moreHeight) * rpx)
    // 上横线
    mc.beginPath()
    mc.setLineWidth(1)
    mc.moveTo(35 * rpx, 45 * rpx)
    mc.lineTo(115 * rpx, 45 * rpx)
    mc.setStrokeStyle('#CBAA8F')
    mc.stroke()
    // 时间
    mc.setFillStyle('#CBAA8F')
    mc.setFontSize(14 * rpx)
    var date = that.data.sharinfo.date.split('-');
    mc.fillText(date[0]+'/'+date[1], 40 * rpx, 70 * rpx)
    // 天
    mc.setFillStyle('#CBAA8F')
    mc.font = 'normal 14px sans-serif';
    mc.setFontSize(80 * rpx)
    mc.fillText(date[2], 30 * rpx, 145 * rpx)
    // 地区
    mc.setFillStyle('#CBAA8F')
    mc.setFontSize(18 * rpx)
    var district = that.data.district;
    var districtLength = district.length - 3
    mc.fillText(district, (286 - (16 * districtLength)) * rpx, 85 * rpx)    
    // 星期
    mc.setFillStyle('#CBAA8F')
    mc.setFontSize(18 * rpx)
    var week_str = that.data.sharinfo.weather_info.week_str;
    mc.fillText(week_str, 286 * rpx, 115 * rpx)
    // 天气
    mc.setFillStyle('#CBAA8F')
    mc.setFontSize(18 * rpx)
    var day_weather = that.data.sharinfo.weather_info.day_weather;
    var max_degree = that.data.sharinfo.weather_info.max_degree;
    var min_degree = that.data.sharinfo.weather_info.min_degree;
    if (day_weather!=undefined){
      var weatherLength = day_weather.length + max_degree.length + min_degree.length - 3
      mc.fillText(day_weather + ' ' + min_degree + '~' + max_degree + '℃', (270 - (16 * weatherLength)) * rpx, 145 * rpx)
    }
    // 下横线
    mc.beginPath()
    mc.setLineWidth(1)
    mc.moveTo(35 * rpx, 165 * rpx)
    mc.lineTo(115 * rpx, 165 * rpx)
    mc.setStrokeStyle('#CBAA8F')
    mc.stroke()
    // 背景
    mc.setFillStyle('#FCF3EB')
    mc.fillRect(35 * rpx, 215 * rpx, 303 * rpx, (130 + moreHeight) * rpx)
    // 文本
    var chr = text.split(""); //这个方法是将一个字符串分割成字符串数组
    var temp = "";
    var row = [];
    mc.font = 'normal 14px sans-serif';
    mc.setFontSize(14 * rpx)
    mc.setFillStyle("#666666")
    for (var a = 0; a < chr.length; a++) {
      if (mc.measureText(temp).width < 166 * rpx) {
        temp += chr[a];
      } else {
        a--; //这里添加了a-- 是为了防止字符丢失
        row.push(temp);
        temp = "";
      }
    }
    row.push(temp); //如果数组长度大于2 则截取前两个 
    if (row.length > 1) {
      var rowCut = row.slice(0, 2);
      var rowPart = rowCut[1];
      var test = "";
      var empty = [];
      for (var a = 0; a < rowPart.length; a++) {
        if (mc.measureText(test).width < 220) {
          test += rowPart[a];
        } else {
          break;
        }
      }
      empty.push(test);
    }
    for (var b = 0; b < row.length; b++) {
      mc.fillText(row[b], 96 * rpx, 175 * 3 / 2 * rpx + b * 22);
    }
    //  小逗号
    var canvasImg = that.data.sharinfo.canvasImg;
    var canvasImg2 = that.data.sharinfo.canvasImg2;
    mc.drawImage(canvasImg, 50 * rpx, 232 * rpx, 11 * rpx, 15 * rpx)
    mc.drawImage(canvasImg, 65 * rpx, 232 * rpx, 11 * rpx, 15 * rpx)
    mc.drawImage(canvasImg2, 315 * rpx, (315 + moreHeight) * rpx, 11 * rpx, 15 * rpx)
    mc.drawImage(canvasImg2, 300 * rpx, (315 + moreHeight) * rpx, 11 * rpx, 15 * rpx)
    // 头像
    var ewm_width = 30 * rpx;
    var ewm_height = 30 * rpx;
    var ewm_x = 35 * rpx;
    var ewm_y = (385 + moreHeight) * rpx;
    mc.save();
    mc.beginPath(); //开始绘制
    mc.arc(ewm_width / 2 + ewm_x, ewm_height / 2 + ewm_y, ewm_width / 2, 0, Math.PI * 2, false);
    mc.fill();
    mc.clip();
    var headimgurl = that.data.sharinfo.headimgurl;
    mc.drawImage(headimgurl, ewm_x, ewm_y, ewm_width, ewm_height);
    mc.restore();
    // 名字
    mc.setFillStyle('#333333')
    mc.setFontSize(14 * rpx)
    var nickname = that.data.sharinfo.nickname;
    mc.fillText(nickname, 35 * rpx, (438 + moreHeight) * rpx)
    // 简介
    mc.setFillStyle('#999')
    mc.setFontSize(12 * rpx)
    mc.fillText("给你满满正能量", 35 * rpx, (463 + moreHeight) * rpx)
    // 二维码
    var qr_code = that.data.qr_code
    mc.drawImage(qr_code, 275 * rpx, (385 + moreHeight) * rpx, 64 * rpx, 64 * rpx)
    // 二维码名称
    mc.setFillStyle('#333')
    mc.setFontSize(12 * rpx)
    var erwText = that.data.sharinfo.app_name;
    var erwTextLength = erwText.length - 1

    if (erwTextLength < 5) {
      mc.fillText(erwText, (300 - erwTextLength * 6) * rpx, (465 + moreHeight) * rpx)
    } else if (erwTextLength < 15 && erwTextLength > 4) {
      mc.fillText(erwText, (260 - (erwTextLength - 5) * 10) * rpx, (465 + moreHeight) * rpx)
    } else {
      var chr = erwText.split(""); //这个方法是将一个字符串分割成字符串数组
      var temp = "";
      var row = [];
      for (var a = 0; a < chr.length; a++) {
        if (mc.measureText(temp).width < 142 * rpx) {
          temp += chr[a];
        } else {
          a--; //这里添加了a-- 是为了防止字符丢失
          row.push(temp);
          temp = "";
        }
      }
      row.push(temp); //如果数组长度大于2 则截取前两个 
      if (row.length > 2) {
        var rowCut = row.slice(0, 2);
        var rowPart = rowCut[1];
        var test = "";
        var empty = [];
        for (var a = 0; a < rowPart.length; a++) {
          if (mc.measureText(test).width < 220) {
            test += rowPart[a];
          } else {
            break;
          }
        }
        empty.push(test);
        var group = empty[0] + "..." //这里只显示两行，超出的用...表示
        rowCut.splice(1, 2, group);
        row = rowCut;
      }
      for (var b = 0; b < row.length; b++) {
        mc.fillText(row[b], 188 * rpx, (465 + moreHeight + b * 18) * rpx);
      }
    }

    mc.draw()

    that.setData({
      loadhide: false,
      is_show_baibao_button:false
    })

    setTimeout(function () {
      wx.canvasToTempFilePath({
        canvasId: 'my-canvas',
        fileType: 'jpg',
        success: function (res) {
          console.log(res.tempFilePath);
          that.setData({
            imgurl: res.tempFilePath,
            can_is_hidden:that.data.is_show_sign
          })
          wx.hideLoading()
          if (that.data.is_show_sign) {
            // requestUtil.get(_DuoguanData.duoguan_host_api_url + '/index.php?s=/addon/Sign/Api/userSign.html', {}, (data) => {
            //   if (data.status == undefined) {
            //     var index = data.index
            //     that.setSignData(index, data)
            //   }
            // }, that, {})
          }
        },
        fail: function (res) {
          console.log(res)
        }
      })
    }, 1000);

    

    
    

  },
  savePic: function () {
    let that = this;
    wx.saveImageToPhotosAlbum({
      filePath: that.data.imgurl,
      success: function (res) {
        if (res.errMsg == 'saveImageToPhotosAlbum:ok') {
          wx.showToast({
            title: '保存成功',
            icon: 'success',
            duration: 2000
          })
        }
      },
      fail: function (res) {

        wx.showModal({
          title: '提示',
          content: '请前往开启保存到相册权限!',
          success: function (res) {
            if (res.confirm) {
              wx.openSetting({ success: function (res) { console.log(res) } })
            } else if (res.cancel) {
              console.log('用户点击取消')
            }
          }
        })
      }
    })
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
    var that = this;
    // requestUtil.get(_DuoguanData.duoguan_host_api_url + '/index.php?s=/addon/DuoguanIntegral/Api/userShare.html', {}, (data) => {
    //   console.log('分享获得积分成功'+data);
    // }, this, {})
    
    var shareTitle = that.data.sharinfo.nickname + '向你分享了一个小程序';

    var is_show_sign = that.data.is_show_sign
    var user_info = wx.getStorageSync('user_info');
    if (is_show_sign==true){
      var sharePath = '/pages/user/share/index?share_uid='+ user_info.uid
    }else{
      var sharePath = _DuoguanData.duoguan_app_index_path + '?share_uid='+ user_info.uid;
    }
    console.log('sharePath', sharePath)
    return {
      title: shareTitle,
      path: sharePath
    }
  },
  onNavigateTo:function(e){
    const dataset = e.currentTarget.dataset ? e.currentTarget.dataset : e.target.dataset;
    const url = dataset.url;
    wx.navigateTo({
      url: url,
    })
  },
  goIndex: function () {
    var that = this;
    var url = _DuoguanData.duoguan_app_index_path;
    console.log(url)
    wx.switchTab({
      url: url,
      success: function (res) { },
      fail: function (res) {

      },
      complete: function (res) { },
    })
  }
})