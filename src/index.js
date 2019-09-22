const promiseFunc = require("./promise");

Promise = promiseFunc;

var promise = new Promise(function(resolve) {
  resolve(42);
});

// пример из задания
promise
  .then(function(value) {
    return value + 1;
  })
  .then(function(value) {
    console.log(value); // 42
    return new Promise(function(resolve) {
      resolve(137);
    });
  })
  .then(function(value) {
    console.log(value); // 137
    throw new Error();
  })
  .then(
    function() {
      console.log("Будет проигнорировано");
    },
    function() {
      return "ошибка обработана";
    }
  )
  .then(function(value) {
    console.log(value); // "ошибка обработана"
  });

// Пример с catch
promise
  .then(function(value) {
    return value + 1;
  })
  .then(function(value) {
    console.log(value); // 42
    return new Promise(function(resolve) {
      resolve(137);
    });
  })
  .then(function(value) {
    console.log(value); // 137
    throw new Error();
  })
  .then(function(value) {
    console.log("Не должно быть вызвано перед ошибки");
  })
  .catch(function() {
    console.log('ошибка обработана в catch');
  });

// resolve
Promise.resolve(function(resolve, reject) {
  resolve(42)
}).then(function(value) {
  console.log(`resolve ${value}`)
});
