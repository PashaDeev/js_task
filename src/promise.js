(function() {
  const utils = require("./helpers/util");
  const errors = require("./helpers/errors");
  const status = require("./helpers/status");

  /**
   * Функция заглушка
   * @param value
   * @return {*}
   */
  const resolver = function(value) {
    return value;
  };

  /**
   * Функция заглушка для ошибки
   * @param reason
   */
  const thrower = function(reason) {
    throw reason;
  };

  /**
   * Является резолвером, а занчит ошибочно
   * @param func
   * @return {boolean}
   */
  const isError = function(func) {
    return func === resolver;
  };

  /**
   * полфил для Promise
   * @constructor
   * @param resolver
   */
  function promiseFunction(resolver) {
    // Проверка на вызов с new
    if (!(this instanceof  promiseFunction)) {
      throw new Error(errors.NEW_ERROR);
    }

    this.status = status.PENDING;
    this.value = false;

    this._fullFillArr = [];
    this._rejectArr = [];

    this._resolveCallback = this._resolveCallback.bind(this);
    this._rejectCallback = this._rejectCallback.bind(this);

    this._resolve(resolver);
  }

  /**
   * Принимает thanable объект
   * @param thenable
   * @return {Promise<unknown>|*|promiseFunction}
   */
  promiseFunction.resolve = function(thenable) {
    const maybePromise = utils.toPromise(thenable);

    if (utils.isPromise(maybePromise)) return maybePromise;

    return new promiseFunction(function (resolve, reject) {
      if (isError(maybePromise)) {
        reject('error');
      } else {
        resolve(thenable);
      }
    });
  };

  /**
   * then
   * @param onFullFill
   * @param onReject
   * @return {promiseFunction}
   */
  promiseFunction.prototype.then = function(onFullFill, onReject) {
    const self = this;

    // проверетя являются ли колбэки функцией
    onFullFill = utils.isCallable(onFullFill) ? onFullFill : resolver;
    onReject = utils.isCallable(onReject) ? onReject : thrower;

    // Создает новый прмис для then
    return new promiseFunction(function(resolve, reject) {
      /**
       * Функция для выполнения переданного аргумента.
       * Выношу в отдельную функцию, чтобы можно было вызвать
       * как для resolve, так для reject
       * @param func
       */
      function tryCatch(func) {
        let value;
        try {
          value = func(self.value);
        } catch (err) {
          reject(err);
          return;
        }

        self._tryThen(resolve, reject, value);
      }

      /**
       * Вызывает успешный колбэк
       */
      function fireOnFullFill() {
        tryCatch(onFullFill);
      }

      /**
       * Вызыветя коллбэк ошибки
       */
      function fireOnReject() {
        tryCatch(onReject);
      }

      switch (self.status) {
        case status.FULLFILLED:
          fireOnFullFill();
          break;
        case status.REJECTED:
          fireOnReject();
          break;
        default:
          this._pushToQueue(fireOnFullFill, fireOnReject);
      }
    });
  };

  promiseFunction.prototype.catch = function(reject) {
    return this.then(resolver, reject);
  };

  /**
   * Добавляет кобэки в оченредь
   * @param resolve
   * @param reject
   * @private
   */
  promiseFunction._pushToQueue = function(resolve, reject) {
    this._fullFillArr.push(resolve);
    this._rejectArr.push(reject);
  };

  /**
   * Resolve
   * Выполняет фнкцию передную в промис
   * @private
   */
  promiseFunction.prototype._resolve = function(resolver) {
    try {
      resolver(this._resolveCallback, this._rejectCallback);
    } catch (err) {
      this._reject(err);
    }
  };

  /**
   * Колбэк для удачного выполнения резолвера
   * @param value
   * @private
   */
  promiseFunction.prototype._resolveCallback = function(value) {
    if (this.status !== status.PENDING) return;
    this._fullFill(value);
  };

  /**
   * Колбэк для неудачного выполнения резолвера
   * @param value причина ошибки
   * @private
   */
  promiseFunction.prototype._rejectCallback = function(value) {
    if (this.status !== status.PENDING) return;
    this._reject(value);
  };

  /**
   * Устанавливает промис в сосотояния fullfilled
   * @param value
   * @private
   */
  promiseFunction.prototype._fullFill = function(value) {
    const maybePromise = utils.toPromise(value);

    const self = this;
    if (utils.isPromise(maybePromise)) {
      maybePromise.then(
        function(value) {
          this._fullFill.call(self, value);
        },
        function(value) {
          this._reject.call(self, value);
        }
      );
    } else {
      this.status = status.FULLFILLED;
      this.value = value;

      this._fullFillArr.forEach(item => {
        item();
      });
    }
  };

  /**
   * Устанавливает промис в состояние rejected
   * @private
   */
  promiseFunction.prototype._reject = function(value) {
    this.status = status.REJECTED;
    this.value = value;

    this._rejectArr.forEach(cb => {
      cb();
    });
  };

  /**
   * Пытается выполнить преданное value как промис
   * @param resolve
   * @param reject
   * @param value
   * @private
   */
  promiseFunction.prototype._tryThen = function(resolve, reject, value) {
    const maybePromise = utils.toPromise(value);

    if (utils.isPromise(maybePromise)) {
      maybePromise.then(resolve, reject);
    } else if (isError(maybePromise)) {
      reject(value);
    } else {
      resolve(maybePromise);
    }
  };

  module.exports = promiseFunction;
})();
