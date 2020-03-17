const app = getApp();
import _ from '../../utils/underscore';
import requestUtil from '../../utils/requestUtil';
import _DuoguanData, { duoguan_host_api_url as API_HOST } from '../../utils/data';
import util from '../../utils/util';
import dg from '../../utils/dg';
import plugUtil from '../../utils/plugUtil';
import wxParse from '../../wxParse/wxParse';
import listener from '../../utils/listener';


const sys = (function(){
	if(typeof (my) !== "undefined"){
		return my;
	}else if(typeof (swan) !== "undefined"){
		return swan;
	}else if(typeof (tt) !== "undefined"){
		return tt;
	}else{
		return wx;
	}
})();

function getModularStyle(options) {
	if (!options) return '';

	const result = [];
	if (options.backgroundSize) result.push('background-size: ' + options.backgroundSize);
	if (options.backgroundRepeat) result.push('background-repeat: ' + options.backgroundRepeat);
	if (options.backgroundColor) result.push('background-color: ' + options.backgroundColor);
	if (options.backgroundImage) result.push('background-image: url(' + options.backgroundImage + ')');
	if (options.backgroundPosition) result.push('background-position: ' + options.backgroundPosition);

	if (options.padding) {
		result.push('padding-left: ' + (options.padding.left * 2) + 'rpx');
		result.push('padding-top: ' + (options.padding.top * 2) + 'rpx');
		result.push('padding-right: ' + (options.padding.right * 2) + 'rpx');
		result.push('padding-bottom: ' + (options.padding.bottom * 2) + 'rpx');
	}
	return result.join(';');
}

function getModularClass(options) {
	if (!options) return '';

	const result = [];
	if (options.controlMargin) result.push('module-bottom-space');
	if (options.textColor) result.push(options.textColor);

	options.isContainerBackground = options.isContainerBackground !== false;
	result.push(options.isContainerBackground ? 'containerBackground' : '');

	return result.join(' ');
}

Page({
    
    data:{
	    isShowCollectionTips:0,
        dgGlobal_options:null,
        
    },
    
	// 收藏关闭
    onCollectCloseTap: function () {
        sys.setStorage({
            key: 'is_show_collection_tips',
            data: 0
        });
        this.setData({
            isShowCollectionTips: 0
        });
    },
    
    onLoad:function(options) {
		sys.getStorage({
			key: 'is_show_collection_tips',
			success:(res)=>{
				let isShowCollectionTips = parseInt(res.data);
				if (isNaN(isShowCollectionTips)) {
					isShowCollectionTips = 1;
				}
				
				 this.setData({
					isShowCollectionTips: isShowCollectionTips
				});
			},
            fail: (err) => {
                this.setData({
                    isShowCollectionTips: 1
                });
            }
		});
    
        this.setData({dgGlobal_options:options});
        this.loadControlOptions(options);
    },
    
    /**
    * 加载页面组件配置数据
    */
    loadControlOptions: function (options) {
        var that = this;
        var _this = this;
       const url = API_HOST + '/index.php/addon/DuoguanUser/Api/getPageCustomConfig';
        requestUtil.get(url, { id: 165088 }, (data) => {
            const { dpart_list } = data;
            delete data.dpart_list;

            for (const key in dpart_list) {
                const item = dpart_list[key];
                dpart_list[key] = Object.assign({}, item, {
                    classList: getModularClass(item),
                    style: getModularStyle(item)
                });
            }

            that.setData({
                config_options: dpart_list,
                __PAGE_CONFIG__: data
            });
            
            that.parseVideoUrl(dpart_list);
            that.updatePageConfig(data);
			
        });
    },
    
    /**
     * 更新页面配置
     */
    updatePageConfig: function (config) {
        // 更新页面标题
        if (typeof my !== "undefined") {
            my.setNavigationBar({
                title: config.p_title,
            });
        } else if (typeof tt !== "undefined") {
            tt.setNavigationBarTitle({
                title: config.p_title
            });
        } else if(typeof swan !== "undefined"){
            swan.setNavigationBarTitle({
                title: config.p_title
            });
        }else if(typeof wx !== "undefined"){
            wx.setNavigationBarTitle({
                title: config.p_title
            });
        }
    },

	/**
	 * 解析视频地址
	 */
    parseVideoUrl: function (options) {
        const videos = [];
        for (const key in options) {
            const item = options[key];
            if (item.autoplay !== undefined && item.src !== undefined) {
                videos.push(item);
            }
        }
        if (videos.length === 0) return;

        requestUtil.post(API_HOST + '/index.php/home/utils/parseVideoUrls', {
            urls: JSON.stringify(videos.map(item => item.src))
        }, (data) => {
            for (let i = 0; i < data.length; i++) {
                const url = data[i];
                videos[i].src = url;
            }
            this.setData({ config_options: options });
        });
    },

    //下拉刷新
    onPullDownRefresh: function () {
        var that = this;
        that.onLoad(that.data.dgGlobal_options);
        setTimeout(() => {
            sys.stopPullDownRefresh();
        }, 1000);
    },
    
    // 分享信息
    onShareAppMessage: function () {
        var that = this;
        var shareTitle = that.data.__PAGE_CONFIG__.share_title || '分享直播';
        var shareDesc = '';
        var shareImage = that.data.__PAGE_CONFIG__.share_pic || '';
        var sharePath = 'pages/custom/custom_671426628';

		var userInfo = sys.getStorageSync(typeof my!== 'undefined' ?{key:"user_info"}:"user_info");
        var log_other_uid =userInfo?userInfo.uid:0;
        var sharePath = 'pages/custom/custom_671426628' + '?log_other_uid=' + log_other_uid;

        return {
            title: shareTitle,
            desc: shareDesc,
            imageUrl: shareImage,
            path: sharePath
        }
    },
    /**
     * 拨打电话
     */
    onCallTap: function (e) {
        if (e.detail.formId) requestUtil.pushFormId(e.detail.formId);

        const dataset = (() => {
            if (e.detail.target) {
                return e.detail.target.dataset;
            }
            return e.currentTarget.dataset || e.target.dataset;
        })(),
        	mobile = dataset.mobile,tips = dataset.tips;
        if (!mobile) return;
        const msg = tips || '你将要拨打电话：' + mobile;

		const method = typeof my !=="undefined"?"confirm":"showModal";
		sys[method]({
			title: '温馨提示',
			content: msg,
			success: (res) => {
				if (!res.confirm) return;
				sys.makePhoneCall({ 
					number: mobile, 
					phoneNumber: mobile, 
				});
			}
		});
    },
   
    /**
     * 跳转页面
     */
    onNavigateTap: function (e) {
     	if (e.detail.formId) requestUtil.pushFormId(e.detail.formId);
     
        const dataset = e.detail.target ? e.detail.target.dataset : e.currentTarget.dataset;
        const url = dataset.url, type = dataset.type, nav = { url: url }, appId = dataset.appId;
        if (dataset.invalid) return console.warn('链接已被禁用');
        console.warn('页面地址未配置');

        if (type === 'mini') {
            sys.navigateToMiniProgram({
                appId: appId, path: url, fail: (err) => {
                    console.error(err);
                }
            });
        } else {
            sys.navigateTo({
                url: url, fail: () => {
                    sys.switchTab({
                        url: url,
                    });
                }
            });
        }
    },

    /**
     * 预览视图
     */
    onPreviewTap: function (e) {
        let dataset = e.target.dataset, index = dataset.index, url = dataset.url;
        if (index === undefined && url === undefined) return;

        let urls = e.currentTarget.dataset.urls;
        urls = urls === undefined ? [] : urls;
        if (index !== undefined && !url) url = urls[index];
        sys.previewImage({ current: url, urls: urls });
    },
 
    /**
    * 充值
    */
    recharge: function (e) {
        let that = this;
        var key = e.currentTarget.dataset.key;
        var config_options = that.data.config_options;
        config_options[key].select_index = e.currentTarget.dataset.index;
        that.setData({ config_options: config_options})
        if (that.data.config_options[key].is_member == 1){
          wx.showModal({
            title: '提示',
            content: '确认购买？',
            success(res) {
              if (res.confirm) {
                let money = e.currentTarget.dataset.money; // 充值金额
                let reward_id = e.currentTarget.dataset.reward_id; // 充值条件
                let condition_id = e.currentTarget.dataset.condition_id; // 充值条件

                const url = API_HOST + "/index.php?s=/addon/Card/CardApi/recharge.html";
                requestUtil.get(url, {
                  money: money,
                  reward_id: reward_id,
                  condition_id: condition_id
                }, (info) => {
                  wx.requestPayment(_.extend(info, {
                    success: (res) => {
                      wx.showToast({
                        title: '充值成功！',
                        duration: 1500,
                      });
                      that.onPullDownRefresh(); // 触发刷新
                    },
                    fail: (res) => {
                      console.error(res);
                    }
                  }));
                });
              } else if (res.cancel) {
                console.log('用户点击取消')
              }
            }
          })
        }else{
          wx.showModal({
            title: '您还不是会员',
            content: '立即开通会员?',
            success(res){
              if (res.confirm){
                wx.navigateTo({
                  url: '/pages/user/member/member-center/index',
                })
              }
            }
          })
        }
    },
    
    /**
    *复制文本
    */
    toCopy:function(e){
        var info = e.currentTarget.dataset.info;
        if(info){
          const method = typeof my !== "undefined" ? "setClipboard" : "setClipboardData";
          if (typeof my !== "undefined"){
            sys[method]({
              text: info,
              success(){
                my.showToast({
                  type: 'success',
                  content: '内容复制成功',
                });
              }
            });
          }else{
            sys[method]({
              data: info,
              success(){
                sys.showToast({
                  title: '内容复制成功',
                  icon: 'success',
                });
              }
            })
          }
        }
    },
    
    /**
    *支付宝轻会员
    */
    toLightMember:function(){
        const url = API_HOST + "/index.php?s=/addon/DuoguanUser/ContactApi/getLightMember.html";
        requestUtil.get(url, {}, (info) => {
          if(info){//正常返回数据时跳轻会员
              var that = this;
              my.navigateToMiniService({
                serviceId: "2019072365974237", // 插件id,固定值勿改
                servicePage: "pages/hz-enjoy/main/index", // 插件?面地址,固定值勿改
                extraData: {
                  "alipay.huabei.hz-enjoy.templateId": info.templateId,
                  "alipay.huabei.hz-enjoy.partnerId": info.partnerId,
                  "alipay.huabei.hz-enjoy.userId": info.uopenid
                },
                success: (res) => {
                  console.log('success', res)
                },
                fail: (res) => { console.log('fail', res) },
              });  
          }
        });
    },
    
    
})