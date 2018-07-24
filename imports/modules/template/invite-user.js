module.exports = `<!DOCTYPE html>
<html>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<link href="https://fonts.googleapis.com/css?family=Lato:400,900" rel="stylesheet">
<title>Join <%= network.name %> on blockcluster.io</title>
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
    <h2 style="margin-bottom: 5px;"><%= invitingUser.profile.firstName %> <%= invitingUser.profile.lastName %> has invited you to join their network <%= network.name %></h2>

    <h4 style="margin-bottom: 0px">Hi,</h4>
    <p style="margin-top: 5px;">
        You have been invited by <%= invitingUser.profile.firstName %> <%= invitingUser.profile.lastName %> (<a href="mailto:<%= invitingUser.emails[0].address %>"><%= invitingUser.emails[0].address %></a>) to join their blockchain network <%= network.name %> on <a href="https://www.blockcluster.io">blockcluster.io</a>.
        <br />
        <br /> Click on the following button to join this network:
        <br />
        <br />
        <a href="<%= networkJoinLink %>" target="_blank" style="background: #48b0f7;
          border-color: #48b0f7;
          color: #fff;
          line-height: 21px;
          cursor: pointer;
          text-shadow: none;
          box-shadow: 2px 1px 3px #ccc;
          padding: 10px 17px;
          border-radius: 5px;
          text-decoration: none;">Join Network</a>
        <br />
        <br />

    </p>
    <h3 style="margin-bottom: 5px;">Don't want to join or unexpected email?</h3>
    <p style="margin-top: 5px;">No worries! Your address may have been entered by mistake. You can ignore or delete this email.
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

</html>`;