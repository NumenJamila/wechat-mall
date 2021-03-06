const _function = require('../../../../utils/functionData');
const requestUtil = require('../../../../utils/requestUtil');
const _DuoguanData = require('../../../../utils/data');
var app = getApp()
Page({
  data: {
    score_arr: [
      {
        'val': 1,
        'ischeck': true
      },
      {
        'val': 2,
        'ischeck': true
      },
      {
        'val': 3,
        'ischeck': true
      },
      {
        'val': 4,
        'ischeck': true
      },
      {
        'val': 5,
        'ischeck': true
      }
    ],
    this_order_id: 0,
    submitIsLoading: false,
    buttonIsDisabled: false,
    this_score_val: 5,
    img_count_limit: 3,
    this_img_i: 0,
    this_img_max: 0,
    this_post_id: 0,
    postimg: []
  },
  onLoad: function (options) {
    var that = this
    var order_id = options.order_id;
    that.setData({
      this_order_id: order_id,
    })
  },
  //上传图片
  chooseimg_bind: function () {
    var that = this
    var img_lenth = that.data.postimg.length
    var sheng_count = that.data.img_count_limit - img_lenth
    if (sheng_count <= 0) {
      wx.showModal({
        title: '提示',
        content: '对不起，最多可上传三张图片',
        showCancel: false
      })
      return false
    }
    wx.chooseImage({
      count: sheng_count,
      sizeType: ['compressed'], // 可以指定是原图还是压缩图，默认二者都有
      sourceType: ['album', 'camera'], // 可以指定来源是相册还是相机，默认二者都有
      success: function (res) {
        // 返回选定照片的本地文件路径列表，tempFilePath可以作为img标签的src属性显示图片
        that.setData({
          postimg: that.data.postimg.concat(res.tempFilePaths)
        })
      }
    })
  },
  //删除
  del_pic_bind: function (e) {
    var that = this
    var index = e.currentTarget.id;
    var datas = that.data.postimg;
    datas.splice(index, 1)
    that.setData({
      postimg: datas
    })
  },
  formSubmit: function (e) {
    var that = this
    var t_con = e.detail.value.content
    that.setData({
      submitIsLoading: true,
      buttonIsDisabled: true
    })
    if (t_con == '') {
      wx.showModal({
        title: '提示',
        content: '对不起，请输入留言内容',
        showCancel: false
      })
      that.setData({
        submitIsLoading: false,
        buttonIsDisabled: false
      })
      return false;
    }
    
    // 是否匿名评价
    let is_anonymous = e.detail.value.is_anonymous.length == 0 ? 0 : 1;

    requestUtil.get(_DuoguanData.duoguan_host_api_url + '/index.php?s=/addon/DuoguanShop/OrderApi/postComment.html',
      { oid: that.data.this_order_id, fval: that.data.this_score_val, fcon: t_con, is_anonymous: is_anonymous },
      (data) => {
          // 上传图片
          let filePathList = this.data.postimg;
          if (filePathList.length == 0) {
              that.initpostCommentOrderData(data);            
          } else {             
              this.uploadImage(that.data.postimg, 0, function(res) {
                  this.initpostCommentOrderData(data);
              }, that.data.this_order_id);
          }
      }, this, { isShowLoading: false });
  },
  initpostCommentOrderData: function (data) {
        var that = this
        that.setData({
            submitIsLoading: false,
            buttonIsDisabled: false
        })
        wx.showModal({
            title: '提示',
            content: "订单评论成功",
            showCancel: false,
            success: function (res) {
                wx.redirectTo({
                    url: '../list/index'
                })
            }
        })
  },
  set_score_bind: function (e) {
    var that = this
    var max_val = e.currentTarget.id
    var datas = that.data.score_arr
    for (var i = 0; i < datas.length; i++) {
      if (i < max_val) {
        datas[i].ischeck = true
      } else {
        datas[i].ischeck = false
      }
    }
    that.setData({
      score_arr: datas,
      this_score_val: max_val
    })
  },
  uploadImage: function (filePathList, index, callback, id) { //上传图片
    if (filePathList.length == index) { // 递归出口
        callback.apply(this, []);
    } else {
        let url = _DuoguanData.duoguan_host_api_url + '/index.php/addon/DuoguanShop/CommentApi/uploadImage/oid/' + id;
        let path = filePathList[index];
        requestUtil.upload(url, path, 'file', {}, (res) => {
            // 此处不处理
        }, this, { completeAfter: function(res){
            // 防止上传失败之后影响程序的正常执行
            this.uploadImage(filePathList, ++index, callback, id); // 递归入口
        }});
    }
  },
})