module.exports = `<!DOCTYPE html>
<html>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<link href="https://fonts.googleapis.com/css?family=Lato:400,900" rel="stylesheet">
<title>[Blockcluster] Support case | Update #<%= support.caseId %></title>
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

  <div style="background: #fdfdfd; width: 80%; margin: auto; padding: 20px;">
    <img src="https://app.blockcluster.io/assets/img/logo/blockcluster.png" alt="logo" />
    <h2 style="margin-bottom: 5px;">Update on support case #<%= support.caseId %></h2>

    <h4 style="margin-bottom: 0px">Hi
        <%= user.name %>,</h4>
    <p style="margin-top: 5px;">
        There is an update on your support case #<%= support.caseId %> - <b><%= support.subject %></b>.

        <hr style="border-top: 1px solid #eee" />
        <div style="padding: 20px; padding-left: 5%; background: #f0f0f0;">
          <p style="text-align: justify;">
            <%- description %>
          </p>
          <p style="text-align: left; font-size: 0.9em">
            <b><%= updatedBy.name %></b><br />
            <%= updatedBy.email %>
          </p>
        </div>

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
