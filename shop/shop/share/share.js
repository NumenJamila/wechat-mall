const app = getApp();
const util = require('../../../utils/util');
const requestUtil = require('../../../utils/requestUtil');
const $ = require('../../../utils/underscore');
const _DuoguanData = require('../../../utils/data');
const WxParse = require('../../../wxParse/wxParse.js');
function GetLength(str) {
    return str.replace(/[\u0391-\uFFE5]/g, "aa").length;
};
Page({

    /**
     * 页面的初始数据
     */
    data: {
        imgurl: '/images/default.png',
        loadhide: true,
        canvasHiden: false,
        sharinfo: {
            pic: {
                goods_pic: '/images/default.png',
                head_pic: '/images/ico_vip.png'
            }
        },
        nowH: 630
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {
        var that = this;
        //获取分享网页面的数据
        requestUtil.get(_DuoguanData.duoguan_host_api_url + '/index.php?s=/addon/DuoguanShop/DuoguanShopApi/share.html', { sid: options.sid, share_type: options.share_type, version: 394 }, (data) => {
            that.initData(data);
    }, this, { isShowLoading: false })
    },
    initData: function (data) {
        var that = this;
        var pic = {};
        //开始绘制海报

        that.data.sharinfo.text = data.text;
        that.setData({
            sharinfo: that.data.sharinfo
        })
        // 下载图片
        wx.downloadFile({
            url: data.pic.goods_pic,
            success: function (res) {
                that.data.sharinfo.pic.goods_pic = res.tempFilePath
                // that.drawPoster()
                wx.downloadFile({
                    url: _DuoguanData.duoguan_host_api_url + data.pic.qr_pic,
                    success: function (res) {
                        that.data.sharinfo.pic.qr_pic = res.tempFilePath
                        wx.downloadFile({
                            url: data.pic.head_pic,
                            success: function (res) {
                                that.data.sharinfo.pic.head_pic = res.tempFilePath
                                wx.downloadFile({
                                    url: data.pic.logo_pic,
                                    complete: function (res) {
                                        console.log(that.data.sharinfo.pic)
                                        that.data.sharinfo.pic.logo_pic = res.tempFilePath
                                        that.drawPoster()
                                    }
                                })
                            }
                        })

                    }
                })
            }
        })


    },
    drawPoster: function () {
        console.log('drawPoster')
        var that = this
        // 获取手机信息
        var phoneMsg = wx.getSystemInfoSync();
        //当天前手机的我宽度
        let pWidth = phoneMsg.windowWidth;
        console.log('屏幕信息', phoneMsg)
        //制订同意的长度单位
        let mpx = pWidth / 375;
        //当前的海报高度
        var nowH = 0;
        console.log(phoneMsg);
        var context = wx.createCanvasContext('myCanvas');
        //绘制背景色
        context.setFillStyle("#ffffff");
        context.fillRect(0, 0, pWidth, 2 * pWidth);
        //放置商品图片

        //获取图片数据
        wx.getImageInfo({
            src: that.data.sharinfo.pic.goods_pic,
            success: function (res) {
                if (res.width > 0 && res.height > 0) {
                    console.log('屏幕宽度', pWidth, res)
                    // 计算商品图片应有的宽高
                    var g_w = pWidth;//商品名图片与手机屏幕宽度一致
                    //通过宽度比例计算图片应有高度
                    var g_h = (g_w / res.width) * res.height;
                    // var g_h = g_w - 50 * mpx;
                    //绘制商品图片
                    console.log('商品图片宽高', g_w, g_h);
                    context.drawImage(that.data.sharinfo.pic.goods_pic, 0, nowH, g_w, g_h);
                    //标记当前海报的高度
                    nowH = g_h + 10 * mpx;
                    context.setFillStyle("#ffffff")

                    // 放置商品名
                    context.setFillStyle("black")
                    var font_size = 16 * mpx
                    context.setFontSize(font_size)
                    var g_name = that.data.sharinfo.text.title_text;
                    //最大书写宽度
                    var max_w = pWidth
                    //换算下屏幕能有多少个单位mpx
                    var m_n = max_w / mpx
                    //最多字数
                    var max_n = Math.floor((m_n - 20) / (15))
                    console.log('最大字数', max_n)
                    //放置初始的位置
                    var g_n_x = 10 * mpx;
                    var g_n_y = nowH;
                    //最多行数

                    var max = Math.ceil(GetLength(g_name) / 2 / max_n);
                    console.log('最大行数')
                    var b, e;
                    //定义商品名称行间距
                    var line_h = 8 * mpx;
                    for (var i = 1; i <= max; i++) {
                        var b = (i - 1) * max_n;
                        var e = i * max_n;
                        if (i <= 1) {
                            var sub_name = g_name.substring(b, e);
                            // console.log('mpx',mpx)
                            // var measureText = context.measureText(sub_name).width;
                            // console.log('measureText()', measureText);
                            context.fillText(sub_name, g_n_x, nowH + i * font_size, max_w - g_n_x * 2);
                            nowH += 2 * font_size
                        } else {
                            var sub_name = g_name.substring(b, b + max_n - 1);
                            //判断一下是否需要绘制。。。
                            let str = max_n * 2 > g_name.length ? sub_name : sub_name + '...'
                            context.fillText(str, g_n_x, nowH + line_h, max_w - g_n_x * 2);
                            nowH += 1 * font_size + line_h
                            max = 2;
                            break
                        }
                    }

                    //价格=========================================================
                    var price_n = Math.ceil(GetLength(that.data.sharinfo.text.msg_text) - 1);
                    var price_w = price_n * 20 * mpx;
                    console.log('price_n:' + price_n)
                    // var price_y = (max + 1) * 22 * mpx + g_n_y - 20 * mpx//价格的绘制y坐标
                    nowH += 25 * mpx
                    var price_y = nowH//价格的绘制y坐标

                    //制造一个开关控制价格的显示位置
                    var is_promote = that.data.sharinfo.text.is_promote  //是否是促销商品的标识
                    var is_showvip = that.data.sharinfo.text.is_showvip  //是否是展示vip价格的标识
                    console.log('is_promote', is_promote, that.data.sharinfo)
                    var price = that.data.sharinfo.text.msg_text + "" //商品价格
                    var market_price = that.data.sharinfo.text.market_price + "" //商品价格
                    //绘制促销
                    //定义促销框的大小
                    var cu_rect_size = 22 * mpx
                    if (is_promote) {
                        context.setFillStyle('#ff4d4d')
                        context.fillRect(g_n_x, nowH - cu_rect_size, cu_rect_size, cu_rect_size)
                        context.setFillStyle('#ffffff')
                        //定义促销字体的大小
                        var cu_font_size = 18 * mpx
                        context.setFontSize(cu_font_size);
                        //不知道为啥字体下沉,-6*mpx为了提升字体位置
                        context.fillText('促', g_n_x + 2 * mpx, nowH - 5 * mpx);
                    }
                    //定义价钱字体符号大小
                    let price_font_icon_size = 22 * mpx
                    context.setFontSize(price_font_icon_size);
                    context.setFillStyle("#ff4d4d");
                    context.fillText('￥', is_promote ? g_n_x + cu_rect_size : g_n_x, nowH, 100);
                    //定义价钱字体大小
                    let price_font_size = 24 * mpx
                    context.setFontSize(price_font_size);
                    context.setFillStyle("#ff4d4d");
                    var price_length = (price.length) * 12 * mpx //价格占的x坐标长度
                    context.fillText(price, is_promote ? g_n_x + cu_rect_size + price_font_icon_size : g_n_x + price_font_icon_size, nowH, price_length);
                    console.log('price_length', price_length, mpx)
                    //绘制原价(市场价格)
                    font_size = 18 * mpx
                    context.setFontSize(font_size);
                    context.setFillStyle("#989898");
                    var margin = 3 * mpx
                    var start_price = is_promote ? g_n_x + price_font_icon_size + + price_length + margin + cu_rect_size : g_n_x + price_font_icon_size + + price_length + margin //绘制价格开始x坐标

                    context.fillText('￥', start_price, nowH, 100);
                    //标识绘制原价横线的长度=促销价的长度
                    var market_line_length = market_price.length * (font_size / 2) + font_size
                    // if (is_promote) {
                    //     context.fillText(that.data.sharinfo.text.promote_txt, start_price + 16 * mpx, price_y, 110);
                    //     let promote_price = that.data.sharinfo.text.promote_price + ''
                    // } else {
                    context.fillText(market_price, start_price + font_size, nowH, 100);
                    // }
                    //绘制横线--（起始坐标以上边绘制的 原价长度为基准--促销价,市场价）
                    context.fillRect(start_price, nowH - 8 * mpx, market_line_length, 1 * mpx)
                    //绘制vip+黑框框
                    if (is_showvip) {
                        // context.setFillStyle('black')
                        // context.fillRect(start_price + 16 * mpx + 8 * market_price.length * mpx + 15 * mpx, price_y - 16 * mpx, 4 * 10 * mpx, 18 * mpx)
                        context.setFillStyle('#ff4d4d')
                        context.setFontSize(font_size);
                        context.fillText('VIP+特价', start_price + market_line_length + 8 * mpx, price_y);
                    }
                    nowH += 17 * mpx  //此处是下边销量相对距离
                    //价格=========================================================
                    let qr_w = max_w - g_n_x * 2
                    let h_width = qr_w * 0.08
                    font_size = 13*mpx
                    //绘制销量=====================================================
                    context.setFontSize(font_size);
                    context.setFillStyle("#989898");
                    var sale_str = ''
                    var index = 0
                    //不同类型绘制销量的文案不一样
                    if (is_promote) {
                        sale_str = that.data.sharinfo.text.new_promote_txt + '限时降价,不能错过!'
                    } else if (is_showvip) {
                        sale_str = '会员更省钱！'
                    } else {
                        sale_str = ''
                    }
                    context.fillText(sale_str, g_n_x, nowH + 4);
                    nowH += font_size + 20*mpx
                    //绘制销量=======================================================

                    //放置用户信息===================================================

                    context.drawImage(that.data.sharinfo.pic.head_pic, g_n_x, nowH, h_width, h_width);
                    //放置用户名字
                    context.setFillStyle("#989898")

                    context.setFontSize(font_size)
                    var u_name = that.data.sharinfo.text.username_text
                    var name_n = Math.ceil(GetLength(u_name));
                    if (name_n > 5) {
                        u_name = u_name.substring(0, 4) + '...'
                    }
                    var h_font_x = g_n_x + h_width + 3 * mpx
                    context.fillText(u_name, h_font_x, nowH + font_size);
                    //分享标语
                    context.setFillStyle("#989898")
                    context.setFontSize(font_size)
                    context.fillText('发现好物, 分享给您', h_font_x, nowH + font_size * 2.3);
                    //放置用户信息===================================================

                    var g_n_y = nowH;
                    var base_qr_y = (max + 0.5) * 22 * mpx + g_n_y - 50 * mpx
                    var qr_width = qr_w * 0.25 //二维码宽度
                    //提示
                    context.setFontSize(font_size);
                    context.setFillStyle("#989898");
                    let xishu = 0.5 //二维码提升系数
                    context.fillText("长按识别", max_w - qr_width - g_n_x + (1.3)*font_size, nowH + (1 - xishu) * qr_width + font_size, qr_width);
                    context.drawImage(that.data.sharinfo.pic.qr_pic, max_w - g_n_x - qr_width, nowH - qr_width * xishu, qr_width, qr_width)
                    nowH = g_n_y + qr_w * 0.20;
                    that.setData({ nowH: nowH });
                    context.save();
                    context.draw()
                    setTimeout(function () {
                        wx.canvasToTempFilePath({
                            canvasId: 'myCanvas',
                            height: nowH,
                            fileType: 'jpg',
                            success: function (res) {
                                console.log(res.tempFilePath);
                                that.setData({
                                    imgurl: res.tempFilePath,
                                    canvasHiden: true,
                                    loadhide: false
                                })
                            }
                        })
                    }, 1500);
                }
            },
            fail: function (res) {
                console.log('出错了', res)
            }
        })
        // context.save();
        // context.draw()

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

    },

    /**
     * 页面上拉触底事件的处理函数
     */
    onReachBottom: function () {

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
    goHome: function () {
        var url = '';
        if (_DuoguanData.duoguan_app_is_superhome == 0) {
            url += "/pages/shop/mall/mall";
        } else {
            url += _DuoguanData.duoguan_app_index_path;
        }
        wx.switchTab({
            url: url,
            fail: () => {
            wx.navigateTo({
            url: url,
        })
    }
    })
    }
})