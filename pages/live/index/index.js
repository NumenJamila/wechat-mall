// pages/Live/index/index.js
import {
    request,
    dg,
    requestUtil,
    _DuoguanData,
    util,
    $,
    _,
    API_HOST
} from '../export.js';
Page({

    /**
     * 页面的初始数据
     */
    data: {
        isShowshare: false,
        isShowPoster: false,
        //直播列表相关
        room_list: [],
        page: 0,
        page_num: 10,
        all_count: 0,
        //所需得图片资源
        pic_obj: {
            anchor_pic: "", //直播间背景图
            qr_pic: '' //二位码路径
        },
        tmp_pic: {
            anchor_pic: '',
            qr_pic: ''
        }, //海报所需临时路径
        download_state: true, //图片资源下载成功标识
        pic_download_index: 0, //海报所需图片下载索引
        select_room_index: null, //选中的直播间索引
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {
        var that = this;
        wx.getSystemInfo({
            success: function (res) {
                console.log('屏幕信息', res)
                var dpx = res.screenWidth / 375;
                that.setData({
                    dpx: dpx
                })
            },
        })
        this.get_list_data(1, true) //拉取列表数据
        this.get_live_config() //拉取直播配置数据
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

    /**
     * 页面相关事件处理函数--监听用户下拉动作
     */
    onPullDownRefresh: function () {
        this.get_list_data(1, true) //拉取列表数据
        this.get_live_config() //拉取直播配置数据
    },

    /**
     * 页面上拉触底事件的处理函数
     */
    onReachBottom: function () {
        this.get_list_data(this.data.page) //拉取列表数据
    },

    /**
     * 用户点击右上角分享
     */
    onShareAppMessage: function (e) {
        console.log('onShareAppMessage', e)
        let that = this
        let select_room_index = that.data.select_room_index
        if (e.from == 'menu') {
            return
        } else {
            return {
                title: this.data.room_list[select_room_index].name,
                path: '/live/live/transfer/transfer?roomid=' + this.data.room_list[select_room_index].roomid,
                imageUrl: this.data.room_list[select_room_index].anchor_img
            };
        }
    },
    /**
     * 拉取直播列表数据
     */
    get_list_data: function (page, is_onload = false) {
        let that = this
        request.get(API_HOST + "/index.php/addon/DuoguanLive/LiveListApi/get_list_data", {
            page: page
        }, (data) => {
            console.log('get_list_data', data.data.length)
            if (data.data.length >0){
                that.setData({
                    room_list: is_onload ? data.data : that.data.room_list.concat(data.data),
                    page: page + 1,
                    page_num: data.page_num,
                    all_count: data.all_count
                })
            }
            wx.stopPullDownRefresh()
        }, this, {})
    },
    /**
     * 拉取直播配置数据
     */
    get_live_config: function () {
        let that = this
        request.get(API_HOST + "/index.php/addon/DuoguanLive/LiveListApi/get_live_config", {}, (data) => {
            console.log('get_live_config', data)
            that.setData({
                config: data
            })
            wx.stopPullDownRefresh()
        }, this, {})
    },
    /**
     * 点击商品图片事件
     */
    goods_click: function (e) {
        console.log('goods_click', e)
        wx.redirectTo({
            url: '/' + e.currentTarget.dataset.url.replace('.html', ''),
        })
    },
    /**
     * 获取直播间二维码
     */
    get_qrcode: function () {
        let that = this
        wx.showLoading({
            title: '海报生成中',
        })
        requestUtil.get(_DuoguanData.duoguan_host_api_url + '/index.php?s=/addon/DuoguanLive/LiveListApi/get_room_qrcode.html', {
            roomid: that.data.room_list[that.data.select_room_index].roomid
        }, (data) => {
            console.log('获取直播间二维码路径', data)
            var dpx = that.data.dpx * 2;
            let obj = that.data.pic_obj
            obj.qr_pic = data
            that.setData({
                isShowshare: false,
                isShowPoster: true,
                pic_obj: obj
            })
            //绘制海报
            that.creatPoster()
        }, {});
    },
    showShareTap: function (e) {
        console.log('showShareTap', e)
        let that = this
        let index = e.currentTarget.dataset.index //获取选中的直播间索引
        //设置海报资源图片对象
        let pic_obj = that.data.pic_obj
        pic_obj.anchor_pic = that.data.room_list[index].anchor_img
        this.setData({
            isShowshare: true,
            select_room_index: index,
            pic_obj: pic_obj,
            pic_download_index: 0
        })
    },
    // 取消分享
    cancleShare: function () {
        this.setData({
            isShowshare: false,
            isShowPoster: false,
        })
    },
    // 绘制海报
    creatPoster: function () {
        this.download_file()
    },
    /**
     * 下载对应的图片(递归半自动)
     * target:下载的图片资源标识
     * url:图片网络路径
     * pic_obj：图片资源对象
     * pic_download_index：图片资源下载位置指针
     */
    download_file: function () {
        let that = this
        let index = that.data.pic_download_index
        let pic_obj_keys = Object.keys(this.data.pic_obj)
        //判断之前图片是否下载成功
        if (!that.data.download_state) {
            wx.showToast({
                title: '资源下载失败',
                duration: 2000,
                icon: 'fail'
            })
            return
        }
        //若指针走到图片最后一个则进行绘制海报
        if (index > pic_obj_keys.length - 1) {
            that.draw_post()
            return
        }
        //下载二维码图片
        wx.downloadFile({
            url: that.data.pic_obj[pic_obj_keys[index]],
            success: function (res) {
                console.log(pic_obj_keys[index] + '---下载成功', res)
                //指针下移
                that.setData({
                    pic_download_index: index + 1,
                    download_state: true
                })
                //设置对应的图片临时路径
                that.download_file_setData(pic_obj_keys[index], res.tempFilePath)
                that.download_file(pic_obj_keys[index], res.tempFilePath)
            },
            fail: function (res) {
                console.log(pic_obj_keys[index] + '---下载失败', res)
                that.setData({
                    pic_download_index: index + 1,
                    download_state: false
                })
            }
        })
    },
    /**
     * 用于下载图片设置对应的值
     * target:下载的资源标识
     * tem_url:临时路径
     */
    download_file_setData: function (target, tem_url) {
        let that = this
        let tmp_pic = that.data.tmp_pic
        switch (target) {
            case 'anchor_pic': //直播间背景图
                tmp_pic.anchor_pic = tem_url
                break
            case 'qr_pic': //二维码图片
                tmp_pic.qr_pic = tem_url
                break
            default:
                console.log('未知的target标识')
                return
                break
        }
        that.setData({
            tmp_pic: tmp_pic
        })
    },
    /**
     * 开始绘制海报
     */
    draw_post: function () {
        console.log('draw_post')
        var that = this;
        let tmp_pic = that.data.tmp_pic //海报所需临时资源对象
        let room = that.data.room_list[that.data.select_room_index]
        var dpx = that.data.dpx;
        var ctx = wx.createCanvasContext("posterCanvas", this);

        var cw = 330 ,
            ch = 500 ;

        ctx.width = cw * dpx;
        ctx.height = ch * dpx;

        // 绘制画布背景
        ctx.save();
        ctx.setFillStyle('#fff');
        ctx.fillRect(0, 0, cw * dpx, ch * dpx);
        ctx.restore();

        // 绘制直播间封面图片
        var img = tmp_pic.anchor_pic;
        var imgTop = 0,
            imgLeft = 0;
        let final_scale = 0.6 //最佳  高/宽
        wx.getImageInfo({
            src: img,
            success: function (res) {
                console.log(res);
                //最初得图片 宽 高
                let imgW = res.width;
                let imgH = res.height;

                // //经过 转换比例之后得宽高
                // let after_w = null
                // let after_h = null
                // //未知图片 高/宽
                // let i_scale = imgH / imgW
                // if (i_scale < final_scale) {
                //   //说明图片 宽度较宽 高度进行转换先达到最佳值
                //   //图片缩放比率
                //   let p1 = (cw * 0.6)/imgH
                //   after_h = cw * 0.6
                //   after_w = imgW * p1
                //   imgLeft = -(after_w - cw) / 2
                // } else if (i_scale >= final_scale) {
                //   //说明图片 高度较高 宽度进行转换先达到最佳值
                //   //图片缩放比率
                //   let p2 =  cw/imgW
                //   after_h = imgH * p2
                //   after_w = cw
                //   imgTop = -(after_h- cw*0.6) / 2
                // }

                console.log(imgLeft, imgTop, cw * dpx, cw * .8 * dpx)
                ctx.drawImage(tmp_pic.anchor_pic, imgLeft * dpx, imgTop * dpx, cw * dpx, cw * .8 * dpx);

                var top = cw * .6 + 28;
                var name = room.name;
                if (name.length > 18) {
                    name = name.slice(0, 17) + '...';
                }
                console.log(name);
                ctx.setFontSize(16 * dpx);
                ctx.setTextAlign('center')
                ctx.setFillStyle('#333');
                ctx.fillText(name, cw / 2 * dpx, top * dpx);
                ctx.fillText(name, cw / 2 * dpx - .5, top * dpx);
                ctx.fillText(name, cw / 2 * dpx, top * dpx - .5);
                // 直播时间
                top += 28;
                var time = '直播人：' + room.anchor_name + room.start_time;
                ctx.setFontSize(12 * dpx);
                ctx.setTextAlign('center')
                ctx.setFillStyle('#999');
                ctx.fillText(time, cw / 2 * dpx, top * dpx);

                // 绘制二维码图片
                top += 26;
                var codeimg = tmp_pic.qr_pic
                ctx.drawImage(codeimg, (cw - 120) / 2 * dpx, top * dpx, 120 * dpx, 120 * dpx);
                top += 144;
                ctx.fillText('长按识别看直播', cw / 2 * dpx, top * dpx);
                ctx.draw();
                //隐藏加载框
                wx.hideLoading()
                //自动保存海报
                that.save_post_to_album(cw, ch)
            }
        })
    },
    /**
     * 保存图片到相册
     */
    save_post_to_album: function (width, height) {
        console.log('save_post_to_album')
        var that = this;
        setTimeout(function () {
            wx.canvasToTempFilePath({
                x: 0,
                y: 0,
                width: width,
                height: height,
                destWidth: 0,
                destHeight: 0,
                canvasId: 'posterCanvas',
                fileType: 'jpg',
                success: function (res) {
                    var img = res.tempFilePath;
                    wx.saveImageToPhotosAlbum({
                        filePath: img,
                        success: function () {
                            wx.showToast({
                                title: '保存成功',
                                duration: 2000
                            });
                            that.setData({
                                isShowshare: false,
                                // isShowPoster: false,
                            })
                        },
                        fail: function (v) {
                            console.log(v)
                            wx.showModal({
                                title: '提示',
                                content: '请前往开启保存到相册权限!',
                                success: function (v) {
                                    if (v.confirm) {
                                        wx.openSetting({
                                            success: function (v) {
                                                console.log(v)
                                            }
                                        })
                                    } else if (v.cancel) {
                                        console.log('用户点击取消')
                                    }
                                }
                            })
                        }
                    });
                },
                fail: function (res) { },
            })
        }, 300)
    },
    /**
     * 轮播图点击事件
     */
    post_click: function (e) {
        console.log('post_click', e)
        let link = e.currentTarget.dataset.link
        //若填入的id为空不做跳转处理
        if (link == '') {
            return
        }
        //匹配跳转规则进行不同的跳转
        var web_patt = /^(http:\/\/[.]*)|(https:\/\/[.]*)/i //web路径正则匹配
        var roomid_patt = /^[\d]*$/i //小程序路径正则匹配
        console.log(web_patt.test(link))
        if (web_patt.test(link)) {
            wx.navigateTo({
                url: '/live/live/web-view/web?src=' + link
            })
        } else if (roomid_patt.test(link)) {
            wx.navigateTo({
                url: '/live/live/transfer/transfer?roomid=' + link,
            })
        } else {
            wx.navigateTo({
                url: '/' + link,
            })
        }
    },
    go: function (e) {
        console.log('go', e)
        wx.navigateTo({
            url: '/live/live/transfer/transfer?roomid=' + e.currentTarget.dataset.id,
        })
    }
})