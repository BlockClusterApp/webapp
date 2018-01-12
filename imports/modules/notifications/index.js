export default {
    success: function(message) {
        $("body").pgNotification({
            style: "circle",
            message: message,
            position: "bottom-right",
            timeout: 5000,
            type: "success",
            thumbnail: '<img width="40" height="40" style="display: inline-block;" src="/assets/img/icons/profile.png" alt="">'
        }).show();
    },
    error: function(message) {
        $("body").pgNotification({
            style: "circle",
            message: message,
            position: "bottom-right",
            timeout: 5000,
            type: "error",
            thumbnail: '<img width="40" height="40" style="display: inline-block;" src="/assets/img/icons/profile.png" alt="">'
        }).show();
    },
}