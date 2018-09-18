module.exports = `
<html>
  <style>
  body {
    font-family: Courier New, Courier, monospace;
    padding: 0;
    margin: 0;
  }
  table {
    width: 100%;
    border: solid 1px #000;
    border-spacing: 0;
  }
  td {
    padding: 5px;
    font-size: 12px;
  }
  .logo-td {
    width: 30%;
    text-align: center;
  }
  .heading-td {
    text-align: center;
    padding: 5px;
    width: 70%;
    border-left: solid 1px #000;
  }
  .heading-td h5,
  .heading-td h2,
  .heading-td h4 {
    margin: 5px 0;
  }
  .invoice-details-left {
    width: 60%;
  }
  .invoice-details-right {
    width: 40%;
    border-left: solid 1px #000;
  }
  td.heading {
    font-weight: bold;
  }
  tr.heading td {
    font-weight: bold;
    text-align: center;
    border-left: solid 1px #000;
    border-bottom: solid 1px #000;
  }
  .item-details-table tr td {
    border-left: solid 1px #000;
    text-align: center;
  }
  td[class="item-*"] {
    padding: 0px;
  }
  tr.invoice-total td {
    border-top: solid 1px #000;
    border-bottom: solid 1px #000;
  }
  .item-details-table td.text {
    text-align: left;
    border-bottom: solid 1px #000;
  }
  /* .item-details-table td {
    font-size: 0.9em;
  } */
  .item-details-table tr.heading td {
    padding: 3px;
  }
  .item-details-table tr.item td {
    padding: 5px 1px;
    /* font-family: Courier New, Courier, monospace; */
  }
  .item-details-table td.blank {
    border-bottom: solid 1px #000;
  }
  .item-s-no {
    width: 3%
  }
  .item-description {
    width: 17%
  }
  .item-code {
    width: 8%
  }
  .item-qty {
    width: 5%
  }
  .item-uom {
    width: 9%
  }
  .item-rate {
    width: 10%
  }
  .item-gross-value {
    width: 8%
  }
  .item-discount {
    width: 6%
  }
  .item-charges {
    width: 7%
  }

</style>
  <body>
  <table class="invoice-heading-table">
    <tr>
      <td class="logo-td">
      <img src='data:image/png;base64,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'/>
      </td>
      <td class="heading-td">
        <h1>INVOICE</h1>
        <h3>Byzantine Technologies Pvt Ltd</h3>
        <p style="font-family: '"Segoe UI", "Helvetica Neue", Helvetica, Arial, sans-serif'">CIN Number:U72200DL2018PTC331594</p>
        <p>
          WZ-23, Rattan Park, New Delhi
        </p>
      </td>
    </tr>
  </table>
  <table class="invoice-details-table">
    <tr>
      <td class="invoice-details-left">
        Invoice No:
        <%= invoice._id %>
      </td>
      <td class="invoice-details-right">
        Customer Name:
        <%= user._id %>
      </td>
    </tr>
    <tr>
      <td class="invoice-details-left">
        Invoice Date:
        <%= invoice.date %>
      </td>
      <td class="invoice-details-right">
        Customer Mobile Number:
        <%= user.profile.mobiles[0].number %>
      </td>
    </tr>
  </table>
  <table class="item-details-table">
    <tr class="heading">
      <td class="item-s-no">
        S.No
      </td>
      <td class="item-description">
        Node Name
      </td>
      <td class="item-code">
        Node ID
      </td>
      <td class="item-uom">
        Duration
      </td>
      <td class="item-rate">
        Rate
      </td>
      <td class="item-discount">
        Disc.
      </td>
      <td class="item-charges">
        Charges
      </td>
      <!-- <td class="item-igst" colspan="2">
        IGST
      </td> -->
    </tr>
    <% for(var i=0; i<items.length; i++) {%>
      <tr class="item">
        <td class="item-s-no">
          <%= i+1 %>
        </td>
        <td class="item-description">
          <%= items[i].name %>
        </td>
        <td class="item-code">
          <%= items[i].instanceId %>
        </td>
        <td class="item-uom">
          <%= items[i].duration %>
        </td>
        <td class="item-rate">
          <%= items[i].rate %>
        </td>
        <td class="item-discount">
          <%= items[i].discount %>
        </td>
        <td class="item-charges">
          <%= items[i].cost %>
        </td>
      </tr>
      <% } %>

        <!-- footer -->
        <tr class="invoice-total">
          <td colspan="5">&nbsp;</td>
          <td colspan="1" class="heading" style="text-align: right;">
            Invoice Total
          </td>
          <td class="invoice-total amount">
            <%= invoice.totalAmount %>
          </td>
        </tr>
        <tr class="invoice-total">
          <td colspan="7" style="text-align: left;">
            <b>Invoice Total ( In Words) :</b>
            <%= invoice.totalAmountInWords %>
          </td>
        </tr>
        <tr>
          <td class="blank" colspan="5">&nbsp;</td>
          <td class="signature heading" colspan="2" rowspan="3">
            <h6>This is a digitally generated document and does not need a signature</h6>
          </td>
        </tr>
        <tr>
          <td class="text heading" colspan="5">Certified that the Particulars given above are true and correct and the amount indicated</td>
        </tr>
        <tr>
          <td class="text" colspan="8">
            <b>Terms and Conditions:</b>
            <ol>
              <li>The payment has to be made within 10th of the Invoice month.</li>
              <li>Delay in payment will lead to node deletion as per the company policy.</li>
              <li>Extra data per node at $ 0.3 / GB-month</li>
              <li>2980 hrs of light nodes free per account</li>
            </ol>
          </td>
        </tr>
  </table>
</body>

</html>
`;
