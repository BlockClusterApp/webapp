module.exports = `<!DOCTYPE html>
<html>
  <head>
    <meta http-equiv="content-type" content="text/html;charset=UTF-8" />
    <meta charset="utf-8" />
    <title>Blockcluster Invoice</title>
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, shrink-to-fit=no"
    />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-touch-fullscreen" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="default" />
    <meta content="" name="description" />
    <meta content="" name="author" />
    <link
      href="https://s3-us-west-2.amazonaws.com/bc-email-t-images/assets/plugins/pace/pace-theme-flash.css"
      rel="stylesheet"
      type="text/css"
    />
    <link
      href="https://s3-us-west-2.amazonaws.com/bc-email-t-images/assets/plugins/bootstrap/css/bootstrap.min.css"
      rel="stylesheet"
      type="text/css"
    />
    <link
      href="https://s3-us-west-2.amazonaws.com/bc-email-t-images/assets/plugins/font-awesome/css/font-awesome.css"
      rel="stylesheet"
      type="text/css"
    />
    <link
      href="https://s3-us-west-2.amazonaws.com/bc-email-t-images/assets/plugins/jquery-scrollbar/jquery.scrollbar.css"
      rel="stylesheet"
      type="text/css"
      media="screen"
    />
    <link
      href="https://s3-us-west-2.amazonaws.com/bc-email-t-images/assets/plugins/select2/css/select2.min.css"
      rel="stylesheet"
      type="text/css"
      media="screen"
    />
    <link
      href="https://s3-us-west-2.amazonaws.com/bc-email-t-images/assets/plugins/switchery/css/switchery.min.css"
      rel="stylesheet"
      type="text/css"
      media="screen"
    />
    <link
      href="https://s3-us-west-2.amazonaws.com/bc-email-t-images/pages/css/pages-icons.css"
      rel="stylesheet"
      type="text/css"
    />
    <link
      class="main-stylesheet"
      href="https://s3-us-west-2.amazonaws.com/bc-email-t-images/pages/css/themes/corporate.css"
      rel="stylesheet"
      type="text/css"
    />
    <style type="text/css">
      @media print {
        body {-webkit-print-color-adjust: exact;}
        }
    </style>
  </head>
  <body>
    <div class=" container   container-fixed-lg">
      <!-- START card -->
      <div class="card card-default m-t-20" style="border:0">
        <div class="card-block">
          <div class="invoice padding-20 sm-padding-10">
            <div>
              <div class="pull-left">
                <img
                  width="235"
                  height="70"
                  alt=""
                  class="invoice-logo"
                  src="https://app.blockcluster.io/assets/img/logo/blockcluster.png"
                />
                <address class="m-t-10">
                  <strong>Byzantine Technologies Corp.</strong><br />
                  55 East, 3rd Avenue, San Mateo, CA 94401, USA
                </address>
              </div>
              <div class="pull-right sm-m-t-20 text-right">
                <h2 class="font-montserrat all-caps hint-text" style="margin-bottom:  0px;">Invoice</h2>
                <!-- CIN :  U7200DL2018PTC331594 --><br />
              </div>
              <div class="clearfix"></div>
            </div>
            <br />
            <br />

              <div class="row" style="padding:0px 20px">
                <table  style="width: 100%">
                  <tr>
                    <td>
                      <table>
                        <tr>
                          <td style="">
                             <p class="small no-margin">Invoice to</p>
                              <h5 class="semi-bold m-t-0"><%= user.name %></h5>
                              <address>
                                <strong>TEL:</strong> <%= user.profile.mobiles[0].number %>
                              </address>
                          </td>
                        </tr>
                      </table>
                    </td>

                    <td style="text-align: right;padding-left: 160px;">
                      <table style="text-align: right;width: 100%">
                        <tr>
                          <td><div class="font-montserrat bold all-caps">Invoice No : </div></td>
                          <td><div class=""><%= invoice._id %></div></td>
                        </tr>

                        <tr>
                          <td><div class="font-montserrat bold all-caps"> Invoice date :</div></td>
                          <td><div class=""><%= invoice.date %></div></td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>

              </div>

            <div class="table-responsive table-invoice" style="border:0px;">
              <table class="table m-t-50" style="border:0px;">
                <thead>
                  <tr>
                    <th class="">Node Name</th>
                    <th class="text-center">ID</th>
                    <th class="text-right">Duration</th>
                    <th class="text-right">Rate</th>
                    <th class="text-right"> Disc.</th>
                    <th class="text-right"> Charges</th>
                  </tr>
                </thead>
                <tbody>
                 <% for(var i=0; i<items.length; i++) {%>
                      <td class="item-description">
                        <%= items[i].name %>
                      </td>
                      <td class="item-id text-center">
                        <%= items[i].instanceId %>
                      </td>
                      <td class="item-uom text-right">
                        <%= items[i].duration %>
                      </td>
                      <td class="item-rate text-right">
                        <%= items[i].rate %>
                      </td>
                      <td class="item-discount text-right">
                        <%= items[i].discount %>
                      </td>
                      <td class="item-charges text-right">
                        <%= items[i].cost %>
                      </td>
                    </tr>
                    <% } %>
                </tbody>
              </table>
            </div>
            <br />
            <br />


            <div class="p-l-15 p-r-15">
              <table style="width: 100%">
                <tr>
                  <td style="width:60%;vertical-align: middle;"> <%= invoice.totalAmountInWords %></td>
                  <td style="background-color: #333;padding: 10px 20px;text-align: right;width:40%"><h5 class="font-montserrat all-caps small no-margin hint-text text-white bold">Total</h5>
                  <h4 class="no-margin text-white"><%= invoice.totalAmount %></h4></td>
                </tr>
              </table>

            </div>
            <br />
            <br />

            <table style="width: 100%">
              <tr>
                <td>
                  <p class="small hint-text">
                    <b style="color: #0b7caf;">Terms and Conditions:</b><br />
                    1: The payment has to be made within 10th of the Invoice month.<br />
                    2: Delay in payment will lead to node deletion as per the company policy.<br />
                    3: Extra data per node at $ 0.3 / GB-month<br />
                  </p>
                </td>
                <td style="text-align: right;">
                    <div style="text-align:right"><p>Byzantine Technologies Corp.</p>
                    <img
                      width="150"
                      height="58"
                      alt=""
                      class="invoice-signature"
                      src="data:image/png;base64,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"
                    />
                    <p>Authorised Signatory</p>
                  </div>
                </td>
              </tr>
            </table>


            <hr />
            <div>
              <img
                src="https://app.blockcluster.io/assets/img/logo/blockcluster.png"
                alt="logo"
                width="88"
                height="27"
              />
              <!-- <span class="m-l-70 text-black sm-pull-right"
                >+34 346 4546 445</span
              > -->
              <span class="m-l-40 text-black sm-pull-right"
                >support@blockcluster.io</span
              >
            </div>
          </div>
        </div>
      </div>
      <!-- END card -->
    </div>
  </body>
</html>`;
