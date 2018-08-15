module.exports = `<!DOCTYPE html>
<html>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<link href="https://fonts.googleapis.com/css?family=Lato:400,900" rel="stylesheet">
<title>[Blockcluster] Support case #<%= support.caseId %></title>
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
    <h2 style="margin-bottom: 5px;">Support Case #<%= support.caseId %></h2>

    <h4 style="margin-bottom: 0px">Hello
        <%= user.name %>,</h4>
    <p style="margin-top: 5px;">
        We have received the following support request from you. Our team is looking into it and will get back to you within 48 hours. Kindly note your case id #<%= support.caseId %> for all future correspondance.

        <hr style="border-top: 1px solid #eee" />
        <div style="padding: 20px; padding-left: 5%; background: #f0f0f0;">
          <h3><%= support.subject %></h3>
          <p style="text-align: justify;">
              <!-- Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec ut suscipit ipsum, ut gravida turpis. Integer pellentesque nisl quis mauris dapibus, in blandit nunc euismod. Suspendisse condimentum, urna vel tincidunt vulputate, massa mauris porttitor libero, eget ullamcorper purus ante porttitor magna. Suspendisse mollis, lectus eu lobortis vehicula, tellus eros maximus lacus, id fermentum nunc arcu et sapien. Duis tortor diam, tincidunt eu hendrerit at, interdum quis tellus. Pellentesque ultrices sapien in lacus convallis, a dictum velit finibus. In porta purus blandit sapien ultrices luctus. Curabitur rhoncus est at purus sodales, et rhoncus ex lobortis. Quisque ultricies ultrices massa a tincidunt. -->
              <!-- <br /><br /> -->
              <!-- Nullam ut nibh dignissim, sodales sem at, suscipit quam. Aenean rhoncus erat eget hendrerit pulvinar. Vestibulum luctus ac tellus eget vehicula. Nam non lectus sit amet est ultricies ullamcorper. Phasellus libero augue, maximus in mauris et, interdum accumsan sem. Sed nec libero id eros ultricies commodo at in erat. Aenean viverra, justo luctus faucibus vulputate, sem nulla mollis risus, vel elementum est ipsum a velit. Quisque elementum porta odio, in pretium sapien laoreet eu. Integer tincidunt, turpis ac feugiat convallis, erat nibh pharetra elit, aliquam convallis ligula mi porta sem. Duis fringilla, nulla sed malesuada viverra, diam libero volutpat odio, in consequat dolor tortor et lorem. Fusce porta purus sapien, et fringilla urna placerat sit amet. Sed odio dui, convallis ac est eget, interdum ornare odio. Integer efficitur gravida massa non facilisis. Aenean ut efficitur tellus. Quisque bibendum ipsum non turpis vestibulum, eu lobortis enim dapibus. -->


            <%- support.description %>
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
