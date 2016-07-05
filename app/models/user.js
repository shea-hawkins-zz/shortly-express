var db = require('../config');
var bcrypt = require('bcrypt');
var Promise = require('bluebird');



var User = db.Model.extend({
  tableName: 'users',
  hasTimestamps: true,
  initialize: function() {
    this.on('creating', this.hashPassword, this);
  },
  hashPassword: function(model, attrs, options) {
    return new Promise(function(resolve, reject) {
      bcrypt.hash(model.get('password'), 10, function(err, hash) {
        if (err) {
          reject(err); 
        }
        model.set('password', hash);
        resolve(hash); // data is created only after this occurs
      });
    });
  }
});


module.exports = User;