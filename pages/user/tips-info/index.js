// pages/pay-success/pay-success.js
import listener from '../../../utils/listener';
import {
	duoguan_user_info_post_url as API_SAVE_USER_INFO,
	duoguan_host_api_url as API_URL
} from "../../../utils/data";
import requestUtil from "../../../utils/requestUtil";

Page({
	/**
	 * 用户信息
	 */
	userInfo: null,

	phone:null,

	/**
	 * 页面的初始数据
	 */
	data: {
	},

	/**
	 * 生命周期函数--监听页面加载
	 */
	onLoad: function (options) {
		console.log(options);
		this.setData({
			type: options.type ? options.type : '',
			backUrl:options.url ? options.url  : '',
		})
	},

	/**
	 * 生命周期函数--监听页面卸载
	 */
	onUnload: function () {
		listener.fireEventListener('user.get_info', [this.userInfo]);
		listener.fireEventListener('user.get_phone', [this.phone]);
	},

	/**
	 * 获取用户权限-兼容老版本
	 */
	onUserInfoTap: function (e) {
		if (wx.canIUse('button.open-type.getUserInfo')) return;
		wx.openSetting({
			success: (res) => {
				if (!res.authSetting['scope.userInfo']) return;
				wx.getUserInfo({
					success: (res) => {
						this.userInfo = res.userInfo;
						wx.navigateBack();
					},
				});
			},
		});
	},

	/**
	 * 获取用户信息（version:1.4.4）
	 */
	onUserInfo: function (e) {
		const detail = e.detail;
		console.log(e)
		if (!detail.userInfo) {
			console.error("授权失败：", e);
		} else {
			const info = this.userInfo = detail.userInfo;
			requestUtil.post(API_SAVE_USER_INFO, {
				nickname: info.nickName,
				headimgurl: info.avatarUrl || info.avatar,
				sex: info.gender,
				city: info.city,
				province: info.province,
				country: info.country,
				language: info.language,
			}, () => {
				wx.navigateBack();
			});
		}
	},

	/**
	 * 获取手机号码
	 */
	onGetPhoneNumber: function (e) {
		let that = this;
		if (!e.detail.encryptedData) {
			wx.navigateBack({})
			return;
		}

		const handler = () => {
			const url = API_URL + '/index.php?s=/addon/DuoguanUser/Api/openCardByWxPhone.html';
			requestUtil.post(url, {
				encryptedData: e.detail.encryptedData,
				iv: e.detail.iv,
			}, (info) => {
				this.phone = info['phone'];
				this.keepUserMobile();
			}, this, {});
		};
		handler();
	},

	keepUserMobile: function () {
		var that = this;
		if (that.phone == '' || that.phone == 'undefined' || that.phone == undefined) return;
		requestUtil.get(API_URL + '/index.php?s=/addon/DuoguanUser/Api/keepUserMobile', {phone:that.phone}, (info) => {
			if(this.data.backUrl!=''){
				wx.reLaunch({
					url:this.data.backUrl
				})
			}else{
				wx.navigateBack({})
			}
		}, this, {});
	},

});