const mysql = require('mysql');
module.exports = function() {
	const conn = mysql.createPool({host:'localhost',user:'root',password:'password',database:'MyCloud',multipleStatements:true}); // 修改数据库配置
	return conn;
}

