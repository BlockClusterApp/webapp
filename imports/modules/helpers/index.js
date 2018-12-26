Array.prototype.remByVal = function(val) {
  for (var i = 0; i < this.length; i++) {
    if (this[i] === val) {
      this.splice(i, 1);
      i--;
    }
  }
  return this;
};

const SupportTicketCodes = {
  1: 'Opened',
  2: 'BlockCluster Action Pending',
  3: 'Customer Action Pending',
  4: 'Cancelled',
  5: 'Resolved',
  6: 'Closed',
};

export default {
  getCurrencySymbol: function(currencyCode) {
    currencyCode = currencyCode.toUpperCase();
    if (currencyCode === 'USD') {
      return '$';
    }
    return 'INR';
  },
  firstLetterCapital: function(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  },
  convertStatusToTag: function(status, text) {
    if (status === 'initializing' || status === 'pending') {
      return `<span class="label label-inverse">${text}</span>`;
    } else if (status === 'running' || status === 'completed') {
      return `<span class="label label-success">${text}</span>`;
    } else if (status === 'down' || status === 'cancelled') {
      return `<span class="label label-important">${text}</span>`;
    } else {
      return `<span class="label">${text}</span>`;
    }
  },
  convertOrderStatusToTag: function(status) {
    if (status === '1') {
      return `<span class="label label-inverse">Pending</span>`;
    } else if (status === '3') {
      return `<span class="label label-success">Exchanged</span>`;
    } else if (status === '2') {
      return `<span class="label label-important">Cancelled</span>`;
    } else {
      return `<span class="label">Unknown</span>`;
    }
  },
  timeConverter(UNIX_timestamp) {
    var a = new Date(UNIX_timestamp * 1000);
    var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    var year = a.getFullYear();
    var month = months[a.getMonth()];
    var date = a.getDate();
    var hour = a.getHours();
    var min = a.getMinutes();
    var sec = a.getSeconds();
    var time = date + ' ' + month + ' ' + year + ', ' + hour + ':' + min;
    return time;
  },
  downloadString(text, fileType, fileName) {
    var blob = new Blob([text], {
      type: fileType,
    });
    var a = document.createElement('a');
    a.download = fileName;
    a.href = URL.createObjectURL(blob);
    a.dataset.downloadurl = [fileType, a.download, a.href].join(':');
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function() {
      URL.revokeObjectURL(a.href);
    }, 1500);
  },
  instanceIDGenerate() {
    var ALPHABET = 'abcdefghijklmnopqrstuvwxyz';
    var ID_LENGTH = 8;

    var rtn = '';
    for (var i = 0; i < ID_LENGTH; i++) {
      rtn += ALPHABET.charAt(Math.floor(Math.random() * ALPHABET.length));
    }
    return rtn;
  },
  generateSecret() {
    var ALPHABET = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890';
    var ID_LENGTH = 8;

    var rtn = '';
    for (var i = 0; i < ID_LENGTH; i++) {
      rtn += ALPHABET.charAt(Math.floor(Math.random() * ALPHABET.length));
    }
    return rtn;
  },
  addZeros(s, n) {
    s = s.toString();
    for (let count = 0; count < n; count++) {
      s = s + '0';
    }

    return s;
  },
  calculateNodeStatus(status) {
    if (status === undefined || status === 'initializing') {
      return 'initializing';
    } else if (status === 'down') {
      return 'down';
    } else if (status === 'running') {
      return 'running';
    } else {
      return 'unknown';
    }
  },
  hexToBase64(str) {
    return btoa(
      String.fromCharCode.apply(
        null,
        str
          .replace(/\r|\n/g, '')
          .replace(/([\da-fA-F]{2}) ?/g, '0x$1 ')
          .replace(/ +$/, '')
          .split(' ')
      )
    );
  },
  base64ToHex(str) {
    for (var i = 0, bin = atob(str.replace(/[ \r\n]+$/, '')), hex = []; i < bin.length; ++i) {
      let tmp = bin.charCodeAt(i).toString(16);
      if (tmp.length === 1) tmp = '0' + tmp;
      hex[hex.length] = tmp;
    }
    return hex.join('');
  },
  getSupportTicketStatus(statusCode) {
    return SupportTicketCodes[statusCode];
  },
  bytesToSize(bytes, precision) {
    var kilobyte = 1024;
    var megabyte = kilobyte * 1024;
    var gigabyte = megabyte * 1024;
    var terabyte = gigabyte * 1024;

    if (bytes >= 0 && bytes < kilobyte) {
      return bytes + ' B';
    } else if (bytes >= kilobyte && bytes < megabyte) {
      return (bytes / kilobyte).toFixed(precision) + ' KB';
    } else if (bytes >= megabyte && bytes < gigabyte) {
      return (bytes / megabyte).toFixed(precision) + ' MB';
    } else if (bytes >= gigabyte && bytes < terabyte) {
      return (bytes / gigabyte).toFixed(precision) + ' GB';
    } else if (bytes >= terabyte) {
      return (bytes / terabyte).toFixed(precision) + ' TB';
    } else {
      return bytes + ' B';
    }
  },
  daysInThisMonth() {
    var now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  },
  hyperionGBCostPerDay() {
    return 0.0114;
  },
  hyperionGBCostPerMonth() {
    return 0.0114 * 30;
  },
  hyperionMinimumCostPerMonth() {
    return 399;
  },
  paymeterMinimimCostPerMonth() {
    return 399;
  },
  paymeterDepositFees() {
    return 0.18;
  },
  paymeterDepositFeesERC20NotFound() {
    return 0.2;
  },
  getFlooredFixed(v, d) {
    return (Math.floor(v * Math.pow(10, d)) / Math.pow(10, d)).toFixed(d);
  },
  downloadFile(sUrl, ext) {
    //If in Chrome or Safari - download via virtual link click
    if (navigator.userAgent.toLowerCase().indexOf('chrome') || navigator.userAgent.toLowerCase().indexOf('safari')) {
      //Creating new link node.
      var link = document.createElement('a');
      link.href = sUrl;

      if (link.download !== undefined) {
        //Set HTML5 download attribute. This will prevent file from opening if supported.
        if (ext) {
          link.download = 'file.' + ext;
        } else {
          link.download = 'file';
        }
      }

      //Dispatching click event.
      if (document.createEvent) {
        var e = document.createEvent('MouseEvents');
        e.initEvent('click', true, true);
        link.dispatchEvent(e);
        return true;
      }
    }

    // Force file download (whether supported by server).
    var query = '&download';

    window.open(sUrl + query);
  },
  daysDifference(timestamp1, timestamp2) {
    var difference = timestamp1 - timestamp2;
    var daysDifference = Math.floor(difference / 1000 / 60 / 60 / 24);

    return daysDifference;
  },
  minutesDifference(timestamp1, timestamp2) {
    var difference = timestamp1 - timestamp2;
    var minutesDifference = Math.floor(difference / 1000 / 60);

    return minutesDifference;
  },
  getRemanningDays: () => {
    var date = new Date();
    var time = new Date(date.getTime());
    time.setMonth(date.getMonth() + 1);
    time.setDate(0);
    var days = time.getDate() > date.getDate() ? time.getDate() - date.getDate() : 0;
    return days;
  },
};
