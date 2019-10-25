/* eslint-disable no-unused-vars */
import { stores, Choerodon } from '@choerodon/boot';
import { DeltaOperation } from 'react-quill';
import _, { find, findIndex, chunk } from 'lodash';
import { uploadImage, uploadFile } from '../api/FileApi';

const { AppState } = stores;
const QuillDeltaToHtmlConverter = require('quill-delta-to-html');

/**
 * 将以base64的图片url数据转换为Blob
 * @param {string} urlData 用url方式表示的base64图片数据
 */
export function convertBase64UrlToBlob(urlData) {
  const bytes = window.atob(urlData.split(',')[1]); // 去掉url的头，并转换为byte

  // 处理异常,将ascii码小于0的转换为大于0
  const buffer = new ArrayBuffer(bytes.length);
  const unit8Array = new Uint8Array(buffer);
  for (let i = 0; i < bytes.length; i += 1) {
    unit8Array[i] = bytes.charCodeAt(i);
  }

  return new Blob([buffer], { type: 'image/png' });
}
/**
 * 从deltaOps中获取图片数据
 * @param {DeltaOperation []} deltaOps
 */
export function getImgInDelta(deltaOps) {
  const imgBase = [];
  const formData = new FormData();
  deltaOps.forEach((item) => {
    if (item.insert && item.insert.image) {
      if (item.insert.image.split(':').length && item.insert.image.split(':')[0] === 'data') {
        imgBase.push(item.insert.image);
        formData.append('file', convertBase64UrlToBlob(item.insert.image), 'blob.png');
      }
    }
  });
  return { imgBase, formData };
}

/**
 * 将富文本中的base64图片替换为对应的url
 * @param {{url:string} []} imgUrlList 图标url对应的
 * @param {any []} imgBase base64图片数组
 * @param {*} text 富文本的文本结构
 */
export function replaceBase64ToUrl(imgUrlList, imgBase, text) {
  const deltaOps = text;
  const imgMap = {};
  imgUrlList.forEach((imgUrl, index) => {
    imgMap[imgBase[index]] = `${imgUrl}`;
  });
  deltaOps.forEach((item, index) => {
    if (item.insert && item.insert.image && imgBase.indexOf(item.insert.image) !== -1) {
      deltaOps[index].insert.image = imgMap[item.insert.image];
    }
  });
}

/**
 * 适用于各个issue的模态框编辑界面富文本上传
 * 富文本内容上传前的图片的检测与上传
 * @param {object} text 富文本的文本结构
 * @param {object} data 要发送的数据
 * @param {function} func 回调
 */
export function beforeTextUpload(text, data, func, pro = 'description') {
  const deltaOps = text;
  const send = data;
  const { imgBase, formData } = getImgInDelta(deltaOps);
  if (imgBase.length) {
    uploadImage(formData).then((imgUrlList) => {
      replaceBase64ToUrl(imgUrlList, imgBase, deltaOps);
      const converter = new QuillDeltaToHtmlConverter(deltaOps, {});
      const html = converter.convert();
      // send.gitlabDescription = html;
      send[pro] = JSON.stringify(deltaOps);
      func(send);
    });
  } else {
    const converter = new QuillDeltaToHtmlConverter(deltaOps, {});
    const html = converter.convert();
    // send.gitlabDescription = html;
    send[pro] = JSON.stringify(deltaOps);
    func(send);
  }
}

export function returnBeforeTextUpload(text, data, func, pro = 'description') {
  const deltaOps = text;
  const send = data;
  const { imgBase, formData } = getImgInDelta(deltaOps);
  if (imgBase.length) {
    return uploadImage(formData).then((imgUrlList) => {
      replaceBase64ToUrl(imgUrlList, imgBase, deltaOps);
      const converter = new QuillDeltaToHtmlConverter(deltaOps, {});
      const html = converter.convert();
      // send.gitlabDescription = html;
      send[pro] = JSON.stringify(deltaOps);
      return func(send);
    });
  } else {
    const converter = new QuillDeltaToHtmlConverter(deltaOps, {});
    const html = converter.convert();
    // send.gitlabDescription = html;
    send[pro] = JSON.stringify(deltaOps);
    return func(send);
  }
}

/**
 * 适用于富文本附件上传以及回调
 * @param {any []} propFileList 文件列表
 * @param {function} func 回调
 * @param {{issueType:string,issueId:number,fileName:string}} config 附件上传的额外信息
 */
export function handleFileUpload(propFileList, func, config) {
  const fileList = propFileList.filter(i => !i.url);
  const formData = new FormData();
  fileList.forEach((file) => {
    // file.name = encodeURI(encodeURI(file.name));
    formData.append('file', file);
  });
  uploadFile(formData, config)
    .then((response) => {
      const newFileList = [
        {
          uid: -1,
          name: fileList[0].name,
          status: 'done',
          url: response,
        },
      ];
      Choerodon.prompt('上传成功');
      func(newFileList);
    })
    .catch((error) => {
      if (error.response) {
        Choerodon.prompt(error.response.data.message);
      } else {
        Choerodon.prompt(error.message);
      }
      const temp = propFileList.slice();
      temp.forEach((one) => {
        if (!one.url) {
          const tmp = one;
          tmp.status = 'error';
        }
      });
      func(temp);
    });
}
export function text2Delta(description) {
  if (!description) {
    return undefined;
  }
  // eslint-disable-next-line no-restricted-globals
  if (!isNaN(description)) {
    return String(description);
  }
  let temp = description;
  try {
    temp = JSON.parse(description.replace(/\\n/g, '\\n')
      .replace(/\\'/g, "\\'")
      .replace(/\\"/g, '\\"')
      .replace(/\\&/g, '\\&')
      .replace(/\\r/g, '\\r')
      .replace(/\\t/g, '\\t')
      .replace(/\\b/g, '\\b')
      .replace(/\\f/g, '\\f'));
  } catch (error) {
    temp = description;
  }
  // return temp;
  return temp || '';
}

/**
 * 将quill特有的文本结构转为html
 * @param {*} delta
 */
export function delta2Html(description) {
  const delta = text2Delta(description);
  const converter = new QuillDeltaToHtmlConverter(delta, {});
  const text = converter.convert();
  if (text.substring(0, 3) === '<p>') {
    return text.substring(3);
  } else {
    return text;
  }
}

export function escape(str) {
  return str.replace(/<\/script/g, '<\\/script').replace(/<!--/g, '<\\!--');
}
// eslint-disable-next-line no-restricted-globals
export function getParams(url = location.href) {
  const theRequest = {};
  if (url.indexOf('?') !== -1) {
    const str = url.split('?')[1];
    const strs = str.split('&');
    for (let i = 0; i < strs.length; i += 1) {
      theRequest[strs[i].split('=')[0]] = decodeURI(strs[i].split('=')[1]);
    }
  }
  return theRequest;
}
export function formatDate(str) {
  const MONTH = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二'];
  if (!str) {
    return '';
  }
  const arr = str.split(' ');
  if (arr.length < 1) {
    return '';
  }
  const date = arr[0];
  const time = arr[1];
  if (!arr[0] || !arr[1]) {
    return '';
  }
  const d = date.split('-');
  const t = time.split(':');
  if (d.length < 3 || t.length < 3) {
    return '';
  }
  return `${d[2]}/${MONTH[d[1] * 1 - 1]}月/${d[0]} ${t[0] < 12 ? t[0] : t[0] * 1 - 12}:${t[1]}  ${t[0] * 1 < 12 ? ' 上' : ' 下'}午`;
}

export function commonformatDate(str) {
  const MONTH = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二'];
  if (!str) {
    return '';
  }
  const arr = str.split(' ');
  if (arr.length < 1) {
    return '';
  }
  const date = arr[0];
  const time = arr[1];
  if (!arr[0] || !arr[1]) {
    return '';
  }
  const d = date.split('-');
  const t = time.split(':');
  if (d.length < 3 || t.length < 3) {
    return '';
  }
  return `${d[0]}/${d[1]}/${d[2]} ${t[0] < 12 ? t[0] : t[0] * 1 - 12}:${t[1]}  ${t[0] * 1 < 12 ? ' 上' : ' 下'}午`;
}

/**
 * 生成指定长度的随机字符串
 * @param len 字符串长度
 * @returns {string}
 */
export function randomString(len = 32) {
  let code = '';
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const maxPos = chars.length;
  for (let i = 0; i < len; i += 1) {
    code += chars.charAt(Math.floor(Math.random() * (maxPos + 1)));
  }
  return code;
}
/**
 * randomWord 产生任意长度随机字母数字组合
 * @param randomFlag 是否任意长度 min-任意长度最小位[固定位数] max-任意长度最大位
 * @param min
 * @param max
 * @returns {string}
 */
export function randomWord(randomFlag, min, max) {
  let str = '';
  let range = min;
  const arr = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];

  // 随机产生
  if (randomFlag) {
    range = Math.round(Math.random() * (max - min)) + min;
  }
  for (let i = 0; i < range; i += 1) {
    const pos = Math.round(Math.random() * (arr.length - 1));
    str += arr[pos];
  }
  return str;
}
export function commonLink(link) {
  const menu = AppState.currentMenuType;
  const {
    type, id: projectId, name, organizationId,
  } = menu;

  return encodeURI(`/agile${link}?type=${type}&id=${projectId}&organizationId=${organizationId}&orgId=${organizationId}&name=${name}`);
}
export function editArtLink(artId) {
  return commonLink(`/art/edit/${artId}`);
}
export function artListLink() {
  return commonLink('/art');
}

export function PIDetailLink(id) {
  return commonLink(`/pi/detail/${id}`);
}
export function PICalendarLink(id, ArtName) {
  const menu = AppState.currentMenuType;
  const {
    type, id: projectId, name, organizationId,
  } = menu;
  return encodeURI(`/agile/art/calendar/${id}?type=${type}&id=${projectId}&organizationId=${organizationId}&name=${name}&ArtName=${ArtName}&orgId=${organizationId}`);
}
export function PIListLink() {
  return commonLink('/pi');
}
export function ProgramBoardLink() {
  return commonLink('/kanban');
}
export function ProgramBoardSettingLink() {
  return commonLink('/kanban/setting');
}
export function ProgramFeatureListLink() {
  return commonLink('/feature');
}
export function issueLink(issueId, typeCode, issueName = null) {
  const menu = AppState.currentMenuType;
  const {
    type, id: projectId, name, organizationId,
  } = menu;
  if (typeCode === 'issue_test' || typeCode === 'issue_auto_test') {
    return encodeURI(`/testManager/IssueManage/testCase/${issueId}?type=${type}&id=${projectId}&name=${name}&organizationId=${organizationId}&orgId=${organizationId}`);
  } else if (issueName) {
    return encodeURI(`/agile/work-list/issue?type=${type}&id=${projectId}&name=${name}&organizationId=${organizationId}&paramIssueId=${issueId}&paramName=${issueName}&orgId=${organizationId}`);
  } else {
    return encodeURI(`/agile/work-list/issue?type=${type}&id=${projectId}&name=${name}&organizationId=${organizationId}&paramIssueId=${issueId}&orgId=${organizationId}`);
  }
}
export function programIssueLink(issueId, issueName, projectId) {
  const menu = AppState.currentMenuType;
  const {
    type, id, name, organizationId,
  } = menu;
  return encodeURI(`/agile/feature?type=${type}&id=${projectId || id}&name=${name}&organizationId=${organizationId}&paramIssueId=${issueId}&paramName=${issueName}&orgId=${organizationId}`);
}
export function testExecuteLink(executeId) {
  const menu = AppState.currentMenuType;
  const {
    type, id, name, organizationId,
  } = menu;
  return encodeURI(`/testManager/TestExecute/execute/${executeId}?type=${type}&id=${id}&name=${name}&organizationId=${organizationId}&orgId=${organizationId}`);
}
export const getProjectId = () => Number(AppState.currentMenuType ? AppState.currentMenuType.id : 0);
export const getProjectName = () => (AppState.currentMenuType ? AppState.currentMenuType.name : '');
export const getOrganizationId = () => (AppState.currentMenuType ? AppState.currentMenuType.organizationId : 0);
export const getIsInProgram = () => true;
// 选择主题
export function configTheme({
  list = [],
  textField = 'text',
  valueFiled = 'value',
  primary = false,
  renderText,
  parseNumber = false,
} = {}) {
  const renderPlaceHolder = (ommittedValues) => {
    const values = [];
    for (const value of ommittedValues) {  
      // eslint-disable-next-line no-restricted-globals
      const target = parseNumber ? find(list, { [valueFiled]: isNaN(value) ? value : Number(value) })
        : find(list, { [valueFiled]: value });
      if (target) {
        if (renderText) {
          values.push(renderText(target));
        } else {
          values.push(target[textField]);
        }
      }
    }
    return values.join(', ');
  };
  return {
    className: `SelectTheme ${primary ? 'primary' : ''}`,
    maxTagCount: 0,
    maxTagPlaceholder: renderPlaceHolder,
  };
}
export function validateFile(rule, fileList, callback) {
  if (fileList) {
    fileList.forEach((file) => {
      if (file.size > 1024 * 1024 * 30) {
        callback('文件不能超过30M');
      } else if (file.name && encodeURI(file.name).length > 210) {
        callback('文件名过长');
      }
    });
    callback();
  } else {
    callback();
  }
}
export function normFile(e) {
  if (Array.isArray(e)) {
    return e;
  }
  return e && e.fileList;
}

/**
 * 根据key从sessionStorage取值
 * @param key
 */
export function getSessionStorage(key) {
  return JSON.parse(sessionStorage.getItem(key));
}

/**
 * 设置或更新sessionStorage
 * @param key
 * @param item
 */
export function setSessionStorage(key, item) {
  return sessionStorage.setItem(key, JSON.stringify(item));
}

/**
 * 根据key从sessionStorage删除
 * @param key
 */
export function removeSessionStorage(key) {
  return sessionStorage.removeItem(key);
}

/**
 * 动态计算名称宽度
 * @param val
 * @returns {number}
 */
export function getByteLen(val) {
  let len = 0;
  for (let i = 0; i < val.length; i += 1) {
    const a = val.charAt(i);
    if (a.match(/[^\x00-\xff]/ig) !== null) { // \x00-\xff→GBK双字节编码范围
      len += 15;
    } else {
      len += 10;
    }
  }
  return len;
}

/**
 * 解析url
 * @param url
 * @returns {{}}
 */
export function getRequest(url) {
  const theRequest = {};
  if (url.indexOf('?') !== -1) {
    const str = url.split('?')[1];
    const strs = str.split('&');
    for (let i = 0; i < strs.length; i += 1) {
      theRequest[strs[i].split('=')[0]] = decodeURI(strs[i].split('=')[1]);
    }
  }
  return theRequest;
}

/**
 * 获取stageList
 * @returns []
 */
export function getStageList() {
  return [
    {
      id: 'prepare',
      code: 'prepare',
      name: '准备',
      colour: '#F67F5A',
    },
    {
      id: 'todo',
      code: 'todo',
      name: '待处理',
      colour: '#ffb100',
    },
    {
      id: 'doing',
      code: 'doing',
      name: '处理中',
      colour: '#4d90fe',
    },
    {
      id: 'done',
      code: 'done',
      name: '完成',
      colour: '#00bfa5',
    },
  ];
}

/**
 * 获取stageMap
 * @returns {}
 */
export function getStageMap() {
  return {
    prepare: {
      id: 'prepare',
      code: 'prepare',
      name: '准备',
      colour: '#F67F5A',
    },
    todo: {
      id: 'todo',
      code: 'todo',
      name: '待处理',
      colour: '#ffb100',
    },
    doing: {
      id: 'doing',
      code: 'doing',
      name: '处理中',
      colour: '#4d90fe',
    },
    done: {
      id: 'done',
      code: 'done',
      name: '完成',
      colour: '#00bfa5',
    },
    none: {
      id: 'none',
      code: 'none',
      name: '无阶段',
      colour: '#EFEFEF',
    },
  };
}
// 获取文件名后缀
export function getFileSuffix(fileName) {
  return fileName.replace(/.+\./, '').toLowerCase();
}

// 转换url的param
export function paramConverter(url) {
  const reg = /[^?&]([^=&#]+)=([^&#]*)/g;
  const retObj = {};
  url.match(reg).forEach((item) => {
    const [tempKey, paramValue] = item.split('=');
    const paramKey = tempKey[0] !== '&' ? tempKey : tempKey.substring(1);
    Object.assign(retObj, {
      [paramKey]: paramValue,
    });
  });
  return retObj;
}

/*
 * 获取IE浏览器版本
 */
function getIeVersion() {
  const IEMode = document.documentMode;
  const rMsie = /(msie\s|trident.*rv:)([\w.]+)/;
  const ma = window.navigator.userAgent.toLowerCase();
  const match = rMsie.exec(ma);
  try {
    return match[2];
  } catch (e) {
    return IEMode;
  }
}

/*
 * 获取oper浏览器版本
 */
function getOperaVersion(userAgent) {
  try {
    if (window.opera) {
      return userAgent.match(/opera.([\d.]+)/)[1];
    } else if (userAgent.indexOf('opr') > 0) {
      return userAgent.match(/opr\/([\d.]+)/)[1];
    }
  } catch (e) {
    return 0;
  }
  return '';
}

/*
 * 判断是否为360浏览器
 */
function validate360(option, value) {
  const { mimeTypes } = window.navigator;
  for (const mt in mimeTypes) {
    if (mimeTypes[mt][option] === value) {
      return true;
    }
  }
  return false;
}

/* eslint-disable */
function isIE() { // 支持IE11
  if (!!window.ActiveXObject || 'ActiveXObject' in window) {
    return true;
  } else {
    return false;
  }
}
/*
* 获取浏览器类型和版本信息
*/
export function getBrowerInfo() {
  const userAgent = window.navigator.userAgent.toLowerCase();
  let browserType = '';
  let browserVersion = '';
  // 浏览器类型-IE
  // if (userAgent.match(/msie/) != null || userAgent.match(/trident/) != null) { // 这个方法对于IE11已经无效了
  if (isIE()) {
    browserType = 'IE';
    browserVersion = getIeVersion();
  }
  // Opero
  else if (window.opera || (userAgent.indexOf('opr') > 0)) {
    browserType = 'opero';
    browserVersion = getOperaVersion(userAgent);
  }
  // 百度 
  else if (userAgent.indexOf('bidubrowser') > 0) {
    browserType = '百度';
    browserVersion = userAgent.match(/bidubrowser\/([\d.]+)/)[1];
  }
  // UC
  else if (userAgent.indexOf('ubrowser') > 0) {
    browserType = 'UC';
    browserVersion = userAgent.match(/ubrowser\/([\d.]+)/)[1];
  }
  // 搜狗
  else if (userAgent.indexOf('metasr') > 0 || userAgent.indexOf('se 2.x') > 0) {
    browserType = '搜狗';
  }
  // QQ
  else if (userAgent.indexOf('tencenttraveler') > 0) {
    browserType = 'QQ';
    browserVersion = userAgent.match(/tencenttraveler\/([\d.]+)/)[1];
  }
  // QQ
  else if (userAgent.indexOf('qqbrowser') > 0) {
    browserType = 'QQ';
    browserVersion = userAgent.match(/qqbrowser\/([\d.]+)/)[1];
  }
  // 遨游
  else if (userAgent.indexOf('maxthon') > 0) {
    browserType = '遨游';
    browserVersion = userAgent.match(/maxthon\/([\d.]+)/)[1];
  }
  // 火狐
  else if (userAgent.indexOf('firefox') > 0) {
    browserType = 'firefox';
    browserVersion = userAgent.match(/firefox\/([\d.]+)/)[1];
  }
  // edge
  else if (userAgent.indexOf('edge') > 0) {
    browserType = 'Edge';
    browserVersion = userAgent.match(/edge\/([\d.]+)/)[1];
  }
  // 谷歌/360
  else if (userAgent.indexOf('chrome') > 0) {
    if (validate360('type', 'application/vnd.chromium.remoting-viewer')) {
      browserType = '360';
    } else {
      browserType = 'Chrome';
      browserVersion = userAgent.match(/chrome\/([\d.]+)/)[1];
    }
  }
  // 苹果
  else if (userAgent.indexOf('safari') > -1) {
    browserType = 'Safari';
    browserVersion = userAgent.match(/safari\/([\d.]+)/)[1];
  }
  return `${browserType}${browserVersion ? '/' : ''}${browserVersion}`;
}
/* eslint-enable */

export function toCanvas(selector) {
  const shotContent = document.querySelector(selector);
  shotContent.style.width = `${document.querySelector(selector).scrollWidth}px`;
  shotContent.style.height = `${document.querySelector(selector).scrollHeight}px`;

  const scaleBy = 2;
  const canvas = document.createElement('canvas');
  canvas.style.width = `${_.parseInt(_.trim(shotContent.style.width, 'px')) * scaleBy}px`;
  canvas.style.height = `${_.parseInt(_.trim(shotContent.style.height, 'px')) * scaleBy}px`;
  const ctx = canvas.getContext('2d');
  ctx.mozImageSmoothingEnabled = false;
  ctx.webkitImageSmoothingEnabled = false;
  ctx.msImageSmoothingEnabled = false;
  ctx.imageSmoothingEnabled = false;

  ctx.scale(scaleBy, scaleBy);

  const opts = {
    useCORS: true, // 【重要】开启跨域配置
    dpi: window.devicePixelRatio,
    canvas,
    scale: scaleBy,
    width: _.parseInt(_.trim(shotContent.style.width, 'px')),
    height: _.parseInt(_.trim(shotContent.style.height, 'px')),
  };

  return { shotContent, opts };
}