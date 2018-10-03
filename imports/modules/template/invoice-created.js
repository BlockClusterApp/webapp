module.exports = `<!DOCTYPE html>
<html>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<link href="https://fonts.googleapis.com/css?family=Lato:400,900" rel="stylesheet">
<title>Bill for <%= invoice.billingPeriodLabel %></title>
<style type="text/css">
  html,
  body,
  p,
  table,
  td,
  div,
  h1,
  h2,
  h3,
  h4,
  a {
    font-family: 'Lato', 'Helvetica Neue', Helvetica, Arial, sans-serif;
  }

  p {
    font-size: 17px;
  }

  p{
    line-height: 1.5em;
  }
</style>

<body>

  <div style="background: #f0f0f0; width: 80%; margin: auto; padding: 20px;">
    <img src="https://app.blockcluster.io/assets/img/logo/blockcluster.png" alt="logo" />
    <h2 style="margin-bottom: 5px;">Bill for <%= invoice.billingPeriodLabel %></h2>

    <h4 style="margin-bottom: 0px">Hi <%= invoice.user.name %>,</h4>
    <p style="margin-top: 5px;">
        Your bill for the period <%= invoice.billingPeriodLabel %> has been generated. Your total amount due is $ <%= invoice.totalAmount %> payable by 10th of this month.
        <br />
        <br />
        <a href="https://app.blockcluster.io/app/payments" target="_blank" style="background: #48b0f7;
          border-color: #48b0f7;
          color: #fff;
          line-height: 21px;
          cursor: pointer;
          text-shadow: none;
          box-shadow: 2px 1px 3px #ccc;
          padding: 10px 17px;
          border-radius: 5px;
          text-decoration: none;">Pay Bill</a>
        <br />
        <br />

    </p>
    <h3 style="margin-bottom: 5px;">Kindly pay your bill before 10th of this month to avoid deletion of nodes</h3>
      <br />
      <br />
    </p>
    <hr style="border-top: 1px solid #ccc" />
    <p class="small no-margin pull-left sm-pull-reset" style="text-align: center; font-size: 0.9em; color: #888">
      <span class="hint-text">Copyright &copy; 2017 </span>
      <span class="font-montserrat">BlockCluster</span>.
      <span class="hint-text">&nbsp;All rights reserved. </span>
      <br />

      <span class="sm-block">
        <a href="https://www.blockcluster.io/terms" class="m-l-10 m-r-10" style="color: #222; text-decoration: none;">Terms of use</a>
        <span class="muted">|</span>
        <a href="https://www.blockcluster.io/privacy" class="m-l-10" style="color: #222; text-decoration: none;">Privacy Policy</a>
      </span>
    </p>
    <p class="small no-margin pull-right sm-pull-reset" style="text-align: center">
      Hand-crafted
      <span class="hint-text">&amp; made with Love</span>
    </p>
  </div>
</body>

</html>`
