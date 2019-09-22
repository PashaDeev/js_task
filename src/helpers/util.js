/**
 * Вызыван ли промис с оператором new
 * @param obj
 * @return {boolean}
 */
function withNew(obj) {
  return obj instanceof Promise;
}

/**
 * Проверяет является агрумент промисом
 * @param obj
 * @return {boolean}
 */
function isPromise(obj) {
  return obj instanceof Promise;
}

/**
 * Проверяет является ли аргумент объектом
 * @param obj
 * @return {boolean}
 */
function isObject(obj) {
  return Object(obj) === obj;
}

/**
 * Прверяет является аргумент функцие
 * @param obj
 * @return {boolean}
 */
function isCallable(obj) {
  return typeof obj === "function";
}

/**
 * Пытается приветси переданный аргумент к промису
 * если в аргумент - объект с методом then или функция
 * @param obj
 * @return {Promise<unknown>|null|*}
 * @private
 */
function toPromise(obj) {
  if (isPromise(obj)) return obj;

  if (!isObject(obj)) return obj;

  let then;
  try {
    then = obj.then;
  } catch {
    throw new Error(`thenable obj no insert`);
  }

  if (!isCallable(obj)) return obj;

  then = obj;

  return new Promise(function(resolve, reject) {
    try {
      then.call(obj, resolve, reject);
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = {
  withNew,
  isPromise,
  isObject,
  isCallable,
  toPromise
};
