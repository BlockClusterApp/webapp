Array.prototype.remByVal = function(val) {
    for (var i = 0; i < this.length; i++) {
        if (this[i] === val) {
            this.splice(i, 1);
            i--;
        }
    }
    return this;
}

export default {
    firstLetterCapital: function(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    },
    convertStatusToTag: function(status, text) {
        if (status === "initializing" || status === "pending") {
            return `<span class="label label-inverse">${text}</span>`
        } else if (status === "running" || status === "completed") {
            return `<span class="label label-success">${text}</span>`
        } else if (status === "down" || status === "cancelled") {
            return `<span class="label label-important">${text}</span>`
        } else {
            return `<span class="label">${text}</span>`
        }
    },
    convertOrderStatusToTag: function(status) {
        if (status === "1") {
            return `<span class="label label-inverse">Pending</span>`
        } else if (status === "3") {
            return `<span class="label label-success">Exchanged</span>`
        } else if (status === "2") {
            return `<span class="label label-important">Cancelled</span>`
        } else {
            return `<span class="label">Unknown</span>`
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
            type: fileType
        });
        var a = document.createElement('a');
        a.download = fileName;
        a.href = URL.createObjectURL(blob);
        a.dataset.downloadurl = [fileType, a.download, a.href].join(':');
        a.style.display = "none";
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
    }
}
