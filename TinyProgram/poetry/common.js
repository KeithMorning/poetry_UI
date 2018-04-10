var config = require('./config.js')

var request = function(option){
  var url = config.baseHost + option.url;
  var app = getApp();
  var jwt = app.globalData.jwt;

  var Authorization = jwt || {};
  Authorization = config.basic_token + ' '+ Authorization;
  wx.request({
    url: url,
    data:option.data || {},
    method:option.method && option.method.toUpperCase() || 'GET',
    header:{
      'content-type':'application/json',
      'WWW-Authenticate':Authorization,
    },
    success:function(res){
      var code = res.statusCode;
      if(/^2\d{2}$/.test(code)){
        typeof option.success === 'function' && option.success(res);
      }else if (code === 403 || code === 401){
        login();
      }else{
        typeof option.fail === 'function' && option.fail(res);
      }
    },
    fail:function(res){
      typeof option.fail === 'function' && option.fail(res);
    },
    complete:function(res){
      typeof option.complete === 'function' && option.complete(res);
    }
  })
};

var login = function(option){
  
  wx.login({
    success:function(res){
      var code = res.code;

      wx.getUserInfo({
        success:function(res){
          var encryptedData = res.encryptedData || 'encry';
          var iv = res.iv || 'iv';
          var app = getApp();
          app.globalData.userInfo = res.userInfo;
          wx.request({
            url: config.baseHost + config.url_weichatOAuth,
            data:{
              code:code,
              encryptedData: encryptedData,
              iv:iv,
              loginType:'weichat',
            },
            method:'POST',
            success:function(res){
              if(res.statusCode === 201 || res.statusCode === 200){
                wx.showToast({
                  title: '登陆成功',
                  icon:'success'
                });
                app.globalData.jwt = res.data.jwt;
                app.globalData.userInfo.id = res.data.userId;
                option && option();
              }else if(res.statusCode === 401){
                register(option);
              }else{
                wx.showToast({
                  title: res.data,
                  icon:'success',
                  duration:2000
                })
              }
            },
            fail:function(res){
              console.log('获取token失败'+res.data);
            }
          })
        },
        fail:function(res){
          console.log('获取用户信息失败'+res.data);
        }
      })
    },
    fail:function(res){
      console.log('登陆失败'+res.data);
    }
  })
};


module.exports = {
  login:login,
  request:request,
}