const _DuoguanData = require('../../../utils/data');
const requestUtil = require('../../../utils/requestUtil');
import {
    duoguan_host_api_url as API_URL
} from "../../../utils/data";
Page({

    /**
     * 页面的初始数据
     */
    data: {
        pay_and_send_gift_info: [],
        phone: '',
        score: 0, //确认收货后的积分
        gift_configs: [], //支付有礼相关策略配置数据
        authorize: false
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function(options) {
        var that = this;
        //取出是否是余额支付的标识
        let is_yue = options.is_yue

        that.setData({
            order_id: options.order_id,
            is_yue: is_yue==undefined?0:is_yue
        });
        let is_yue_arr = ['微信支付','余额支付','货到付款'];
        that.setData({is_yue_str:is_yue_arr[that.data.is_yue]})
        requestUtil.get(_DuoguanData.duoguan_host_api_url + '/index.php?s=/addon/DuoguanShop/Api/getConfig.html', {}, (info) => {
            that.setData({
                config: info
            })
        }, that, {
            isShowLoading: false
        });
        requestUtil.get(_DuoguanData.duoguan_host_api_url + '/index.php?s=/addon/DuoguanShop/Api/getCommunityConfig.html', {}, (info) => {
            that.setData({
                community_config: info
            })
        }, that, {
            isShowLoading: false
        });
        //获取支付有礼相关信息
        requestUtil.get(_DuoguanData.duoguan_host_api_url + '/index.php?s=/addon/DuoguanShop/PayAndHaveGiftApi/get_pay_gift_config.html', {
            order_id: options.order_id
        }, (info) => {
            console.log('get_pay_gift_config', info)
            that.setData({
                score: info.score,
                gift_configs: info.gift_configs
            })
        }, that, {
            isShowLoading: false
        });
        //获取用户会员卡信息
        requestUtil.get(API_URL + "/index.php?s=/addon/DuoguanUser/CardApi/getInfo.html", {}, (info) => {
            console.log('获取会员卡信息', info);
            this.setData({
                card_info: info
            });
        }, this, {
            isShowLoading: false
        });
        //获取订单信息
        requestUtil.get(API_URL + "/index.php?s=/addon/DuoguanShop/OrderApi/orderInfo.html", { oid: options.order_id}, (info) => {
            console.log('获取订单信息', info);
            this.setData({
                order_info: info
            });
        }, this, {
            isShowLoading: false
        });
        that.getPayAndSendGiftInfo(1, '');
    },

    getPayAndSendGiftInfo: function(type, authorize_phone) {
        var that = this;
        if (type == 2 && (authorize_phone == '' || authorize_phone == 'undefined' || authorize_phone == undefined)) return;
        requestUtil.get(_DuoguanData.duoguan_host_api_url + '/index.php?s=/addon/DuoguanShop/PayAndHaveGiftApi/getPayAndSendGiftInfo.html', {
            order_id: that.data.order_id,
            type: type,
            authorize_phone: authorize_phone
        }, (info) => {
            that.setData({
                pay_and_send_gift_info: info
            })
        }, that, {
            isShowLoading: false
        });
    },

    /**
     * 获取手机号码
     */
    onGetPhoneNumber: function(e) {
        let that = this;
        if (!e.detail.encryptedData) {
            return;
        }

        const handler = () => {
            const url = API_URL + '/index.php?s=/addon/DuoguanUser/Api/openCardByWxPhone.html';
            requestUtil.post(url, {
                encryptedData: e.detail.encryptedData,
                iv: e.detail.iv,
            }, (info) => {

            }, this, {
                isShowLoading: true,
                loadingText: '获取中',
                completeAfter: function(res) {
                    // 兼容处理 此次为兼容支付宝小程序
                    let info = res.data.data;
                    this.setData({
                        phone: info['phone']
                    });
                    this.getPayAndSendGiftInfo(2, info['phone']);
                }
            });
        };
        handler();
    },

    subscribeMassage: function() {
        let that = this;
        let template_id = [that.data.config.shop_config.subscribe_shipping_choice_tid];
        wx.requestSubscribeMessage({
            tmplIds: template_id,
            success(res) {
                console.log('success', res);
            },
            fail(res) {
                console.log('fail', res);
            },
            complete(res) {
                console.log('complete', res);
            }
        })
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

    },
    /**
     * 评价标签用户点击事件
     */
    label_click: function (e) {
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
                let labels = that.data.labels.map(function (e) {
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
     * 随机点击一个评论标签
     */
    random_click_label: function () {
        //拿到所有的评论标签数据
        let labels = this.data.labels
        //过滤标签数据（排除已经点击过的标签）
        let new_labels = []
        for (var i = 0; i < labels.length; i++) {
            if (!labels[i].clicked) {
                new_labels.push(labels[i])
            }
        }
        console.log('1111', new_labels)
        //获取标签的总长度()
        let length = new_labels.length
        if (length > 0) {
            //获取随机索引标签,进行点击
            let index = length == 1 ? 0 : Math.floor(Math.random() * length)
            let label = new_labels[index]
            //伪造表单点击数据结构
            let e = {
                currentTarget: {
                    dataset: {
                        id: label.id,
                        clicked: label.clicked,
                    }
                }
            }
            console.log('random_click_label', e, new_labels)
            //调用点击标签方法
            this.label_click(e)
        }
    },
    /**
     * 获取分享页所需的数据（分享用）
     */
    get_reminder_pages_data: function () {
        let that = this
        requestUtil.get(_DuoguanData.duoguan_host_api_url + '/index.php?s=/addon/DuoguanShop/PayAndHaveGiftApi/get_reminder_pages_data.html', {
            order_id: that.data.order_id
        }, (info) => {
            console.log('33333', info)
            that.setData({
                labels: info.labels
            })
            //随机点击一个评论标签
            that.random_click_label()
        }, that, {
            isShowLoading: false
        });
    },
    /**
     * 用户点击右上角分享
     */
    onShareAppMessage: function(e) {
        console.log(e)
        //是否是点击gift策略分享进来的
        let gift = e.target == undefined ? '' : e.target.dataset.gift
        var that = this;
        //更新订单状态为1
        requestUtil.post(_DuoguanData.duoguan_host_api_url + '/index.php?s=/addon/DuoguanShop/OrderApi/alter_share_status.html', {
            order_id: that.data.order_id,
            share_status: 1
        }, (info) => {

        }, that, {
            isShowLoading: false
        });
        //若是点击gift策略分享进来的话--需要请求后端发放礼品
        if (gift == 'gift') {
            //更新订单状态为1
            requestUtil.post(_DuoguanData.duoguan_host_api_url + '/index.php?s=/addon/DuoguanShop/PayAndHaveGiftApi/send_share_way_gift.html', {
                order_id: that.data.order_id,
            }, (info) => {

            }, that, {
                isShowLoading: false
            });
        }
        var log_other_uid = wx.getStorageSync("user_info").uid;
        //进行随机点一个标签
        that.get_reminder_pages_data()
        if (that.data.community_config.is_open == 1) {
            var path = '/pages/shop/reminder/reminder?order_id=' + that.data.order_id + '&self_address_id=' + that.data.community_config.self_address_id + '&colonel_uid=' + that.data.community_config.colonel_uid + '&log_other_uid=' + log_other_uid;
            return {
                title: '接单提醒',
                path: path,
                imageUrl: 'http://static.ixiaochengxu.cc/mofang/images/shop/ordersTopBg.png'
            };
        } else {
            return {
                title: '接单提醒',
                path: 'pages/shop/reminder/reminder?order_id=' + that.data.order_id + '&log_other_uid=' + log_other_uid,
                imageUrl: 'http://static.ixiaochengxu.cc/mofang/images/shop/ordersTopBg.png'
            };
        }
    },
    gohome: function(e) {
        let that = this;
        let template_id = [that.data.config.shop_config.subscribe_shipping_choice_tid];
        wx.requestSubscribeMessage({
            tmplIds: template_id,
            success(res) {
                console.log('success', res);
            },
            fail(res) {
                console.log('fail', res);
            },
            complete(res) {
                console.log('complete', res);
                if (_DuoguanData.duoguan_app_is_superhome) {
                    wx.switchTab({
                        url: _DuoguanData.duoguan_app_index_path
                    })
                } else {
                    wx.switchTab({
                        url: '/pages/shop/mall/mall'
                    })
                }
            }
        });
    },
    goOrder: function() {
        let that = this;
        let template_id = [that.data.config.shop_config.subscribe_shipping_choice_tid];
        wx.requestSubscribeMessage({
            tmplIds: template_id,
            success(res) {
                console.log('success', res);
            },
            fail(res) {
                console.log('fail', res);
            },
            complete(res) {
                console.log('complete', res);
                wx.navigateTo({
                    url: '/pages/shop/order/list/index'
                })
            }
        });
    },
    authorizeInputName: function(e) {
        var that = this;
        let value = e.detail.value;
        let authorize_info = that.data.authorize_info;
        authorize_info.name = value;
        authorize_info.isDisabled = value.length >= 2 ? true : false;
        this.setData({
            authorize_info: authorize_info,
        });
    },
    /**
     * 获取手机号码
     */
    onGetPhoneNumber1: function(e) {
        this.card_name = wx.getStorageSync("user_info").nickname;
        let that = this;

        if (!e.detail.encryptedData) {
            if (this.data.open_card_version == '2') {
                util.userMobile("bind", function(res) {
                    let open_card_info = that.data.open_card_info;
                    open_card_info.isDisabled = true;
                    if (res.mobile) {
                        that.phone = res.mobile;
                        open_card_info.phone = res.mobile;
                        that.setData({
                            open_card_info: open_card_info,
                        });
                        that.onOpenTap();
                    } else {
                        // 获取手机号失败
                        that.setData({
                            open_card_info: open_card_info,
                        });
                    }
                });
            }
            return;
        }

        const handler = (code) => {
            const url = API_URL + '/index.php?s=/addon/DuoguanUser/CardApi/openCardByWxPhone.html';
            requestUtil.post(url, {
                encryptedData: e.detail.encryptedData,
                iv: e.detail.iv,
                code: code,
                name: this.card_name || '',
                ver: '0.0.1',
                is_open_card: 'no', // 兼容参数
            }, (info) => {
                // this.session_key = info.session_key;

                // wx.showToast({ title: '开卡成功！' });
                // const card_info = this.data.card_info;
                // card_info.show = false;
                // card_info.status = 1;
                // this.setData({ card_info: card_info });
            }, this, {
                isShowLoading: true,
                loadingText: '获取中',
                completeAfter: function(res) {
                    // 兼容处理 此次为兼容支付宝小程序
                    let info = res.data.data;
                    console.log('开卡种', info)
                    let open_card_info = {};
                    open_card_info['phone'] = info['open_card_status'] == 'no' ? info['phone'] : open_card_info['phone'];
                    open_card_info['isDisabled'] = this.data.open_card_version == "2" ? true : false;

                    this.phone = open_card_info['phone']; // 兼容处理onInputValue方法

                    this.setData({
                        open_card_info: open_card_info,
                    });
                    this.onOpenTap();

                }
            });
        };
        handler()
    },
    /**
     * 开卡操作
     */
    onOpenTap: function() {
        const url = API_URL + '/index.php?s=/addon/DuoguanUser/CardApi/openCard.html';
        requestUtil.post(url, {
            phone: this.phone,
            code: this.verify_code,
            name: this.card_name || '',
            ver: '0.0.1',
            open_card_version: this.data.open_card_version, // 兼容处理
        }, (info) => {
            wx.showToast({
                title: '开卡成功！',
                duration: 2500
            });
            const card = this.data.card_info;
            card.show = false;
            card.status = 1;

            this.setData({
                card_info: card
            });
        });
    },
})
