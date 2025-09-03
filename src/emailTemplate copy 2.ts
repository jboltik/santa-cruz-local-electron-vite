const emailTemplate: string = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <title>VVUS Newsletter</title>
    <meta http-equiv="content-type" content="text/html; charset=utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta http-equiv="x-ua-compatible" content="IE=edge">
    <meta name="x-apple-disable-message-reformatting">
	<meta name="color-scheme" content="light dark">
	<meta name="supported-color-schemes" content="light dark">

    <!--[if mso]>
      <style type="text/css">
        body,
        table,
        td {
          font-family: Georgia, Times, 'Times New Roman', serif;
        }
        li {
          text-indent: -1em;
        }
      </style>
    <![endif]-->
    
  
<style type="text/css">
		:root {
			color-scheme: light dark;
			supported-color-schemes: light dark;
		}

		body,table,td,a{
			-webkit-text-size-adjust:100%;
			-ms-text-size-adjust:100%;
		}
		table,td{
			mso-table-lspace:0;
			mso-table-rspace:0;
		}
		img{
			border:0;
			height:auto;
			line-height:100%;
			outline:none;
			text-decoration:none;
			-ms-interpolation-mode:bicubic;
		}
		table{
			border-collapse:collapse !important;
		}
		body{
			height:100% !important;
			margin:0 !important;
			padding:0 !important;
			width:100% !important;
		}
		#body{
			height:100% !important;
			margin:0 !important;
			padding:0 !important;
			width:100% !important;
		}
		.appleLinks a{
			color:#000000;
			text-decoration:none;
			font-weight:300;
			font-family:Georgia, Times, 'Times New Roman', serif;
		}
		.blue-links a{
			color:#888888;
			text-decoration:none;
		}
		u+#body a{
			color:inherit;
			text-decoration:none;
			font-size:inherit;
			font-family:inherit;
			font-weight:inherit;
			line-height:inherit;
		}
		a[x-apple-data-detectors]{
			color:inherit !important;
			text-decoration:none !important;
			font-size:inherit !important;
			font-family:inherit !important;
			font-weight:inherit !important;
			line-height:inherit !important;
		}
		img{
			outline:none;
			text-decoration:none;
			-ms-interpolation-mode:bicubic;
			height:auto !important;
			float:center !important;
			align:center !important;
			width:100%;
		}
		.img-avatar{
			width: 60px !important;
			max-width: 60px !important;
			height: auto !important;
			border-radius: 50%;
			display: block;
		}

		a img{
			border:none;
		}
		#bodyTable{
			max-width:600px;
		}
		.headerLink{
			color:#ffffff;
			text-decoration:none;
			font-weight:300;
			font-size:13px;
			font-family:Georgia, Times, 'Times New Roman', serif;
		}
		.dvd,.dvd hr{
			border:1px dotted #cccccc;
			max-width:560px;
		}
		a{
			-webkit-text-size-adjust:100%;
			-ms-text-size-adjust:100%;
			color:#2484C6;
			text-decoration:none;
			font-weight:normal;
		}
		.bodyTextBold a,.bodyTextBold>p>a{
			-webkit-text-size-adjust:100%;
			-ms-text-size-adjust:100%;
			color:#2484C6;
			text-decoration:none;
			font-weight:bold;
		}
		.bodyTextBold p{
			padding-bottom:0px !important;
			padding-top:0px !important;
			line-height:160%;
			margin-top:0px !important;
			margin-bottom:0px !important;
		}
		.img-caption a{
			color:#2484C6;
			text-decoration:none;
			font-weight:normal;
			-webkit-text-size-adjust:100%;
			-ms-text-size-adjust:100%;
		}
		.button img{
			background-color:#2484C6 !important;
		}
		.emailButton{
			max-width:560px;
			width:100% !important;
		}
		.body-copy,.body-copy p{
			font-family:Georgia, Times, 'Times New Roman', serif;
			font-weight:300;
			font-size:19px;
			line-height:150%;
			text-align:left;
			color:#000000;
		}
		.body-copy a{
			-webkit-text-size-adjust:100%;
			-ms-text-size-adjust:100%;
			color:#2484C6;
			padding-bottom:0 !important;
			text-decoration:none;
			font-weight:normal;
		}
		.caption{
			font-family:Georgia, Times, 'Times New Roman', serif;
			font-size:14px;
			-webkit-text-size-adjust:100%;
			-ms-text-size-adjust:100%;
			line-height:120%;
			font-weight: normal;
			display:block !important;
			text-align:center !important;
			padding-top: 0px; 
			margin-top: 0px;
		}
		.headline,.headline3,.headline32{
			font-size:32px;
			color:#000000;
			font-weight:700;
			letter-spacing:2px;
			line-height:110%;
			font-family:Georgia, Times, 'Times New Roman', serif;
			padding-bottom:0px !important;
		}
		.cls{
			padding-top:5px;
			padding-bottom:15px;
		}
		.m_cfa{
			color:#666666;
			display:block;
			padding-top:10px;
			font-family:Georgia, Times, 'Times New Roman', serif;
		}
		.m_cf{
			color:#666666;
			display:block;
			font-family:Georgia, Times, 'Times New Roman', serif;
		}
		h1{
			font-family:Georgia, Times, 'Times New Roman', serif;
			font-size:32px;
			font-weight:700;
			line-height:130%;
			text-align:left;
			color:#000000;
		}
		h2{
			font-size:32px;
			font-family:Georgia, Times, 'Times New Roman', serif;
			font-weight:700;
			padding-top:0px;
			margin-top:0px;
			padding-bottom:0px!important;
			margin-bottom:0px;
			color:#16191E;
		}
		h3{
			font-weight:300;
			margin-bottom:0px;
			font-size:15px!important;
			color:#3c3c3c;
			display:block;
			padding-bottom:2px;
			padding-top:20px;
			font-family:Georgia, Times, 'Times New Roman', serif;
			background:none;
			line-height:130%;
		}

		.listtext > u > a, .listtext > a,  .listtext b u > a, .listtext u b > a {
			text-decoration: underline;
			color: #2484C6;
		}

		li{
			padding-bottom:8px;
		}
		ul.custom-list{
			list-style:none;
			padding:0;
		}
		ul.custom-list li{
			margin-bottom:10px;
			display:flex;
			align-items:center;
		}
		ul.custom-list img{
			margin-right:10px;
		}

		ol {
			list-style-type: decimal !important;
			margin-left: 1.5em !important;
			padding-left: 0 !important;
		}

		ol li {
			display: list-item !important;
		}

	@media screen and (max-width: 480px){
		.footer-icons{
			float:none !important;
			text-align:left !important;
			margin-left:0 !important;
		}

}	@media screen and (max-width: 480px){
		.footer-icons td{
			text-align:left !important;
			padding-right:15px !important;
		}

}	@media screen and (max-width: 480px){
		.m_oot{
			width:100%!important;
		}

}	@media screen and (max-width: 480px){
		.m_otc,.m_oll{
			display:block!important;
			width:100%!important;
		}

}	@media screen and (max-width: 480px){
		.m_orc{
			font-size:16px!important;
			line-height:125%!important;
			padding-top:15px!important;
			padding-right:15px!important;
			margin-right:10px!important;
			margin-top:10px!important;
			display:block!important;
		}

}	@media screen and (max-width: 480px){
		.m_orct{
			font-size:16px!important;
			line-height:125%!important;
			padding-right:10px!important;
			margin-right:10px!important;
			margin-top:10px!important;
			display:block!important;
		}

}	@media screen and (max-width: 480px){
		.fot{
			display:block !important;
			text-align:left !important;
		}

}	@media screen and (max-width: 480px){
		.ftt,.ftt p,.ftt p a{
			text-align:left !important;
		}

}	@media screen and (max-width: 480px){
		.headline3,.headline32{
			font-size:25px !important;
			line-height:125% !important;
		}

}	@media screen and (max-width: 480px){
		.caption{
			font-size:14px !important;
			font-weight:normal !important;
			line-height:125% !important;
			display:block !important;
			text-align:center !important;
		}

}	@media screen and (max-width: 480px){
		.pie1{
			min-width:170px !important;
		}

}	@media screen and (max-width: 480px){
		.pie2{
			min-width:100px !important;
		}

}	@media screen and (max-width: 480px){
		.mmo{
			font-size:10px !important;
		}

}	@media screen and (max-width: 480px){
		.cta{
			padding:1px 8px !important;
		}

}		.oci-i{
			max-width:150px;
			height:auto !important;
		}
	@media screen and (max-width: 480px){
		.mjp{
			padding:0px 15px 25px 15px !important;
		}

}	@media screen and (max-width: 480px){
		.mh2s {
			font-size:28px !important;
			line-height:125% !important;
		}

}	
		
@media screen and (max-width: 480px){
		 h4{
			font-size:18px !important;
			line-height:120% !important;
		}

}

@media screen and (max-width: 480px){
		.oci-i{
			max-width:50% !important;
			height:auto !important;
		}

}	@media screen and (max-width: 480px){
		.otc-img{
			max-width:25% !important;
			width:25% !important;
		}

}	@media screen and (max-width: 480px){
		.smimg,.orc-img{
			max-width:55% !important;
			width:55% !important;
			height:auto !important;
		}

}	@media screen and (max-width: 480px){
		.smimg2,.orc-img2{
			max-width:40% !important;
			width:40% !important;
			height:auto !important;
		}

}	@media screen and (max-width: 480px){
		.bltimg,img.bltimg{
			width:30px !important;
			max-width:30px !important;
			height:30px !important;
		}

}	@media screen and (max-width: 480px){
		.blt-img{
			max-width:65% !important;
			width:65% !important;
			height:auto !important;
		}

}	@media screen and (max-width: 480px){
		.otc-img2{
			max-width:85% !important;
			width:85% !important;
		}

}	@media screen and (max-width: 480px){
		.img-avatar{
			max-width:85% !important;
			width:85% !important;
		}

}	@media screen and (max-width: 480px){
		.orc-img{
			padding-top:45px !important;
		}

}	@media screen and (max-width: 480px){
		.otc,.oll{
			display:block !important;
			width:100% !important;
		}

}	@media screen and (max-width: 480px){
		.otcc{
			display:inline !important;
			width:75% !important;
		}

}	@media screen and (max-width: 480px){
		.otcca{
			display:inline !important;
			width:15% !important;
		}

}	@media screen and (max-width: 480px){
		.jb-pm{
			padding:10px 25px !important;
		}

}	@media screen and (max-width: 480px){
		.oot{
			width:100% !important;
			max-width:100% !important;
		}

}	@media screen and (max-width: 480px){
		.otc,.oll{
			display:block !important;
			width:100% !important;
		}

}	@media screen and (max-width: 480px){
		.oci{
			height:auto !important;
			max-width:480px !important;
			width:100% !important;
			padding-top:0px !important;
			margin-top:0px !important;
			padding-left:0px !important;
			padding-right:15px !important;
			display:block !important;
		}

}	@media screen and (max-width: 480px){
		.olc{
			font-size:16px !important;
			line-height:125% !important;
			padding-top:10px !important;
			margin-top:0px !important;
			margin-left:15px !important;
		}

}	@media screen and (max-width: 480px){
		.orc{
			font-size:16px !important;
			line-height:125% !important;
			padding-top:15px !important;
			padding-left:15px !important;
			padding-right:15px !important;
			margin-right:10px !important;
			margin-top:10px !important;
			display:block !important;
		}

}	@media screen and (max-width: 480px){
		.jobtitle{
			font-size:18px !important;
		}

}
		


@media screen and (max-width: 480px){
.listtext {
  font-size: 18px !important;
  line-height: 28px !important;
}
}

	@media (prefers-color-scheme:dark){
		.dark-img{
			display:block !important;
			width:auto !important;
			overflow:visible !important;
			float:none !important;
			max-height:inherit !important;
			max-width:inherit !important;
			line-height:auto !important;
			margin-top:0 !important;
			visibility:inherit !important;
		}

}	@media (prefers-color-scheme:dark){
		.body-copy,.body-copy p{
			color:#ffffff !important;
		}

}	@media (prefers-color-scheme:dark){
		.headerLink{
			color:#ffffff !important;
		}

}	@media (prefers-color-scheme:dark){
		.body-copyd,.body-copyd p{
			color:#2484C6 !important;
		}

}	@media (prefers-color-scheme:dark){
		.body-copyd p a,.bodycopyd a,.body-copy a,.body-copy p a{
			color:#2484C6  !important;
		}

}	@media (prefers-color-scheme:dark){
		.light-img{
			display:none !important;
		}

}	@media (prefers-color-scheme:dark){
		.mbg{
			background-color:#000000 !important;
		}

}	@media (prefers-color-scheme:dark){
		.dmbg{
			background-color:#000000 !important;
		}

}	@media (prefers-color-scheme:dark){
		.dmb{
			background-color:#000000 !important;
			color:#ffffff !important;
		}

}	@media (prefers-color-scheme:dark){
		.dbk{
			background-color:#000000 !important;
			color:#ffffff !important;
		}

}	@media (prefers-color-scheme:dark){
		.headline3{
			color:#ffffff !important;
		}

}	@media (prefers-color-scheme:dark){
		.headline32{
			color:#000000 !important;
		}

}	@media (prefers-color-scheme:dark){
		.clss{
			background-color:#6C6D75 !important;
			border-left:20px solid #6C6D75 !important;
			border-right:20px solid #6C6D75 !important;
			color:#ffffff !important;
		}

}	@media (prefers-color-scheme:dark){
		.clss a{
			color:#2484C6 !important;
		}

}	@media (prefers-color-scheme:dark){
	/*
	@media (prefers-color-scheme:dark){
	*/
		.m_cf,.m_cfa{
			/*@media (prefers-color-scheme:dark){*/color:#c5c4c4 !important;
		}

}	@media (prefers-color-scheme:dark){
		[data-ogsc] .dark-img{
			display:block !important;
			width:auto !important;
			overflow:visible !important;
			float:none !important;
			max-height:inherit !important;
			max-width:inherit !important;
			line-height:auto !important;
			margin-top:0px !important;
			visibility:inherit !important;
		}

}	@media (prefers-color-scheme:dark){
		[data-ogsc] .light-img{
			display:none !important;
		}

}	@media (prefers-color-scheme:dark){
		[data-ogsc] .mbg{
			background-color:#000000 !important;
		}

}	@media (prefers-color-scheme:dark){
		[data-ogsc] .dmbg{
			background-color:#000000 !important;
		}

}	@media (prefers-color-scheme:dark){
		[data-ogsc] .dmb{
			background-color:#000000 !important;
			color:#ffffff !important;
			border:20px solid #000000 !important;
		}

}	@media (prefers-color-scheme:dark){
		[data-ogsc] .dbk,[data-ogsc] .oot,[data-ogsc] .jobtitle{
			background-color:#000000 !important;
			color:#ffffff !important;
		}

}	@media (prefers-color-scheme:dark){
		.oot,.jobtitle{
			background-color:#000000 !important;
			color:#ffffff !important;
		}

}	@media (prefers-color-scheme:dark){
		[data-ogsc] .headline3{
			color:#ffffff !important;
		}

}	@media (prefers-color-scheme:dark){
		[data-ogsc] .headline32{
			color:#000000 !important;
		}

}	@media (prefers-color-scheme:dark){
		[data-ogsc] .clss{
			background-color:#6C6D75 !important;
			border-left:20px solid #6C6D75 !important;
			border-right:20px solid #6C6D75 !important;
			color:#ffffff !important;
		}

}	@media (prefers-color-scheme:dark){
		[data-ogsc] .clss a{
			color:#2484C6 !important;
		}

}	@media (prefers-color-scheme:dark){
	/*
	@media (prefers-color-scheme:dark){
	*/
		[data-ogsc] .body-copy,[data-ogsc] .body-copy p{
			/*@media (prefers-color-scheme:dark){*/color:#ffffff !important;
		}

}	@media (prefers-color-scheme:dark){
		[data-ogsc] .body-copyd,[data-ogsc] .body-copyd p{
			color:#ffffff !important;
		}

}	@media (prefers-color-scheme:dark){
		[data-ogsc] .body-copy p a,[data-ogsc] .body-copy a{
			color:#ffffff !important;
		}

}	@media (prefers-color-scheme:dark){
		[data-ogsc] .body-copyd a,[data-ogsc] .body-copyd p a{
			color:#ffffff !important;
		}

}	
		
 

@media (prefers-color-scheme:dark){
		h1, .listtext {
			color:#ffffff !important;
		}

}	@media (prefers-color-scheme:dark){
		[data-ogsc] h1, [data-ogsc]  .listtext{
			color:#ffffff !important;
		}
}	@media (prefers-color-scheme:dark){
		[data-ogsc] .headerLink,[data-ogsc] .headerLink a{
			color:#ffffff !important;
		}
}	@media (prefers-color-scheme:dark){
		[data-ogsc] .m_cf,[data-ogsc] .m_cfa{
			color:#ffffff !important;
		}

}	@media (prefers-color-scheme:dark){
		.dml{
			color:#2484C6 !important;
		}

}	@media (prefers-color-scheme:dark){
		[data-ogsc] .dml{
			color:#2484C6 !important;
		}

}	@media (prefers-color-scheme:dark){
		.dmla{
			color:#ffffff !important;
		}

}	@media (prefers-color-scheme:dark){
		[data-ogsc] .dmla{
			color:#ffffff !important;
		}

}

@media (prefers-color-scheme:dark){
		.mh2s {
			color:#4DA3FF !important;
		}

}	@media (prefers-color-scheme:dark){
		[data-ogsc] .mh2s {
			color:#4DA3FF !important;
		}

}
		

@media (prefers-color-scheme:dark){
		.date{
			color:#000000 !important;
		}

}	@media (prefers-color-scheme:dark){
		[data-ogsc] .date{
			color:#000000 !important;
		}

}	@media (prefers-color-scheme:dark){
		.caption{
			color:#ffffff !important;
		}

}	@media (prefers-color-scheme:dark){
		[data-ogsc] .caption{
			color:#ffffff !important;
		}

}	
		
@media (prefers-color-scheme:dark){
		h4, h3, li, .dmw, .dmjl{
			color:#ffffff !important;
		}

}	@media (prefers-color-scheme:dark){
		[data-ogsc] h4, [data-ogsc] h3, [data-ogsc] .dmjl, [data-ogsc] li, [data-ogsc] dmw{
			color:#ffffff !important;
		}

}


@media (prefers-color-scheme:dark){
	h2{
			color:#86b3e3 !important;
		}

}	@media (prefers-color-scheme:dark){
	[data-ogsc] h2{
			color:#86b3e3 !important;
		}

}

@media (prefers-color-scheme:dark){
		.sdsn{
			color:#000000 !important;
		}

}	@media (prefers-color-scheme:dark){
		[data-ogsc] .sdsn{
			color:#000000 !important;
		}

}	@media (prefers-color-scheme:dark){
		.ssd,.ssd p{
			color:#000000 !important;
		}

}	@media (prefers-color-scheme:dark){
		[data-ogsc] .ssd,[data-ogsc] .ssd p{
			color:#000000 !important;
		}

}</style></head>
<body style="margin: 0 !important; padding: 0 !important;background-color: #ffffff;" class="darkmode">   
    <div style="
            display:none;
            max-height:0;
            overflow:hidden;
        ">
		 *|MC_PREVIEW_TEXT|*
    </div>
    
    <div style="
            display:none;
            max-height:0px;
            overflow:hidden;
        ">
        &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847;
        &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847;
        &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847;
        &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847;
        &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847;
        &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847;
        &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847;
        &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847;
        &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847;
        &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847;
    </div>

<!-- outer container-->
    <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color:#ffffff;" id="body" class="mbg">
    <tr>
        <td align="center">
            <!--[if (gte mso 9)|(IE)]>
            <table align="center" border="0" cellspacing="0" cellpadding="0" width="600">
            <tr>
            <td align="center" valign="top" width="600">
            <![endif]-->

            <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="max-width:600px;" id="bodyTable">
                <tr>
                    <td align="center">
<!-- outer container-->

<!-- two column header -->
<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="min-width: 100%; border-collapse: collapse !important;" bgcolor="#004A8F">
  <tr>
    <td align="center" bgcolor="#004A8F" style="padding: 0; margin: 0;">
      <!-- inner max-width table -->
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; width: 100%; border-collapse: collapse;" bgcolor="#004A8F">
        <tr>
          <td align="left" valign="middle" width="50%" style="
              text-align: left;
              padding: 10px;
              background-color: #004A8F;
            " bgcolor="#004A8F">
            <a href="https://vvus.com/" target="_blank" style="
                text-decoration: none;
                font-weight: 300;
                font-size: 13px;
                font-family: Georgia, Times, 'Times New Roman', serif;
                color: #ffffff;
              ">
              <img
                src="https://d2ry6alzkxkaqo.cloudfront.net/nltr/vertex-white-logo.png"
                alt="Vertex Ventures US"
                style="display: block; max-width: 140px; width: 100%; height: auto; border: none;"
                width="140"
              />
            </a>
          </td>

          <td align="right" valign="middle" width="50%" style="
              text-align: right;
              padding: 10px;
              background-color: #004A8F;
            " bgcolor="#004A8F">
            <a href="###" style="
                text-decoration: none;
                font-weight: 300;
                color: #ffffff;
                font-size: 13px;
                font-family: Georgia, Times, 'Times New Roman', serif;
              ">
              *|DATE:F j, Y|*
            </a>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
<!-- two column header -->




<!-- repeatable tables -->
<table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="margin: 0 auto; border-spacing: 0;" class="dbk">

<!-- start content section -->
    <tr>
        <td align="left" style="
                background-color:#ffffff;
                font-family: Georgia, Times, 'Times New Roman', serif;
                text-align: left;
                vertical-align: bottom;
                color: #000000; 
            " class="dmb body-copy">
       
        
     
			{{INSERTED_HTML}} 
           
            


    <p style="font-size: 8px; margin: 0px 0px;">&nbsp;</p>

            <table border="0" cellpadding="0" cellspacing="0" width="100%" class="oot oot-b">
                <tr>
                    <td align="center" valign="top">
                <!--[if (gte mso 9)|(IE)]>
			        <table width="600" align="center">
				        <tr>
					        <td width="540">
					        <![endif]-->
                            
                            <table border="0" cellpadding="0" cellspacing="0" width="450" align="left" class="left_column otcc">
                                <tr>
                                    <td style="padding:0px; vertical-align: middle;" class="olc-t">
                                    <h3 style="font-weight: 700;letter-spacing: 6px; color: #4d63ff; padding-bottom: 3px; margin-bottom: 3px;">VERTEX PORTFOLIO</h3>
                                    <h2 style="color: #004A8F; font-weight: 500; font-size: 28px; font-weight: bold " class="mh2s">
                                        Job of the Week
                                    </h2>
                                </td>
                                </tr>
                            </table>
                            <!--[if (gte mso 9)|(IE)]>
                                                </td>
                                                <td width="124">
                                                <![endif]-->
                            <table border="0" cellpadding="0" cellspacing="0" width="124" align="right" class="right_column otc-img">
                                <tr>
                                <td style="padding:0px;vertical-align: top;" class="orc-img" valign="bottom">
                                    <p style="font-size: 8px;">&nbsp;</p>
                                    <img alt="Jobs Arrow" src="https://d2ry6alzkxkaqo.cloudfront.net/nltr/right-arrow-gradient1.png" style="max-width: 75px; width:100%;display:block !important; float:right;" class="smimg" width="75" align="right"> 
                                </td>
                                </tr>
                            </table>
                            <!--[if (gte mso 9)|(IE)]>
                          </td>
                        </tr>
                    </table>
                <![endif]-->
                </td>
                </tr>
                </table>



         
             
                <table border="0" cellpadding="0" cellspacing="0" width="100%" class="oot oot-r" style="background-color: #f6f6f7; margin-top:15px !important; border-radius: 8px;" bg="#f6f6f7">
                    <tr>
                        <td align="center" valign="top">
                


                   <!--[if (gte mso 9)|(IE)]>
			        <table width="600" align="center">
				        <tr>
					        <td width="170" valign="top" >
					        <![endif]-->
                            <table border="0" cellpadding="0" cellspacing="0" width="25%" align="left" class="left_column otc">
                                <tr>
                                <td style="text-align: center; padding: 25px 15px 30px 15px;" class="olc">
                                    <center>
                                        <a href="{{JOB_LINK}}" target="_blank" mc:edit="joblogolinkhere" style="text-decoration: none;">
                                            <p style="font-size: 3px;">&nbsp;</p>
                                            <img alt="Job of the Week Logo" src="{{COMPANY_LOGO}}" style="max-width: 125px; width:100%;display:block !important; float:center;margin-left: auto; margin-right: auto;" class="oci-i" width="125" align="center" mc:edit="joblogo">
                                        </a>
                                    </center> 
                                  
                                    <center>
                                        <p style="font-size: 12px; margin: 0px 0px;">&nbsp;</p>
                          
                                        <div mc:edit="applyhereurl">
                                            <!--[if mso]>
                                            <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="{{JOB_LINK}}" style="height:40px;v-text-anchor:middle;width:100px;" arcsize="10%" strokecolor="#4d63ff" fillcolor="#4d63ff">
                                              <w:anchorlock/>
                                              <center style="color:#ffffff;font-family:Georgia, Times, 'Times New Roman', serif;font-size:13px;font-weight:bold;">Apply Here</center>
                                            </v:roundrect>
                                          <![endif]-->
                                           <a href="{{JOB_LINK}}"
   class="dmjl"
   style="
     background-color:#4d63ff;
     border:1px solid #4d63ff;
     border-radius:4px;
     color:#ffffff !important;
     display:inline-block;
     font-family:Georgia, Times, 'Times New Roman', serif;
     font-size:13px;
     font-weight:bold;
     line-height:40px;
     text-align:center;
     text-decoration:none;
     width:100px;
     -webkit-text-size-adjust:none;
     mso-hide:all;
   "
   target="_blank">
   Apply Here
</a>

                                         
                                        </div>
                                    </center>
                                </td>
                                </tr>
                            </table>
                            <!--[if (gte mso 9)|(IE)]>
                                                </td>
                                                <td width="510">
                                                <![endif]-->
                            <table border="0" cellpadding="0" cellspacing="0" width="75%" align="right" class="right_column otc">
                                <tr>
                                <td style="padding:15px 15px 20px 10px;" class="mjp">
                                    <span mc:edit="jobheadlinelink">
                                        <a target="_blank" href="{{JOB_LINK}}" class="shl" style="font-weight: 600;text-decoration: none !important;color:#000000;font-size: 22px; line-height:125%;display:block; font-family:Georgia, Times, 'Times New Roman', serif; padding-bottom:8px;">
                                            <h3 class="jobtitle" style="font-weight: bold; color:#000000; margin-top:0px;font-size: 20px !important;display:block;">
                                            {{JOB_TITLE}} at {{COMPANY_NAME}}
                                            </h3>
                                        </a>
                                    </span>
                                  
                                    <p mc:edit="jobparagraph" class="sdsn" style="display: block !important; font-size: 16px;font-family: Georgia, Times, 'Times New Roman', serif;color: #111111; white-space: normal;word-wrap: break-word;">
                                    {{JOB_DESCRIPTION}}
									</p>
                                    <span mc:edit="findmorejobs link and text">
                                        <a href="https://jobs.vertexventures.com/companies/{{COMPANY_NAME}}#content" style="color: color:#2484C6;">
                                            <h5 class="sdp" style="text-decoration: underline;color:#2484C6;font-family: Georgia, Times, 'Times New Roman', serif;display:block !important; font-size: 16px;
                                            font-weight: 400; padding-top: 0px; margin-top: 0px; padding-bottom: 0px; margin-bottom: 0px; ">
                                            Find more jobs at {{COMPANY_NAME}} here.
                                            </h5>
                                        </a>
                                    </span>  
                                </td>
                                </tr>
                            </table>
                            <!--[if (gte mso 9)|(IE)]>
                          </td>
                        </tr>
                    </table>
                <![endif]-->
            </td>
        </tr>
        </table>


      
        <center>
       <div style="max-width: 75%;">


	   <p mc:edit="linktovertexjobboard" style="font-weight: bold; text-align: center; font-size: 16px;font-family: Georgia, Times, 'Times New Roman', serif;color: #4d63ff;  white-space: normal;word-wrap: break-word;">
	   <a href="https://jobs.vertexventures.com/companies" target="_blank" style="text-decoration: none">For more startup jobs from across the Vertex Ventures US portfolio, check out our jobs portal.</a>
   </p>


<p>&nbsp;</p>






<table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation">
  <tr>
    <td align="center">
      <table border="0" cellpadding="0" cellspacing="0" role="presentation">
        <tr>
          <td align="center" style="padding: 0 7px;">
            <a href="https://www.linkedin.com/company/vvus" target="_blank" rel="noreferrer">
              <img src="https://d2ry6alzkxkaqo.cloudfront.net/nltr/lkdicon.png" alt="LinkedIn" width="35" height="35" style="display:block; border:0; max-width:35px; height: auto !important;">
            </a>
			
          </td>
          <td align="center" style="padding: 0 7px;">
            <a href="https://x.com/vertexventures?lang=en" target="_blank" rel="noreferrer">
              <img src="https://d2ry6alzkxkaqo.cloudfront.net/nltr/xicon.png" alt="X" width="35" height="35" style="display:block; border:0;  max-width:35px; height: auto !important;">
            </a>
			
          </td>
          <td align="center" style="padding: 0 7px;">
            <a href="https://www.youtube.com/@vvus" target="_blank" rel="noreferrer">
              <img src="https://d2ry6alzkxkaqo.cloudfront.net/nltr/yticon.png" alt="YouTube" width="35" height="35" style="display:block; border:0; max-width:35px; height: auto !important;">
            </a>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>



            

       <p>&nbsp;</p>
       </div>
    </center>              
              
                   








        </td>
    </tr>
<!-- end read section -->




</table>
<!-- repeatable tables -->



<!-- start footer -->

<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="#292a33" class="footer dmbg" style="background-color: #292a33;">
	<tr>
		<td align="center">




                              
<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="600" class="m_oot" style="
		margin:0 auto;
		border-spacing:0;
	">
    <tr>
        <td align="center" valign="top" style="padding: 6px 25px 0px 25px">

		<center>
	<a href="https://vvus.com/" target="_blank" rel="noreferrer">
                        <img alt="VVUS Logo" src="https://d2ry6alzkxkaqo.cloudfront.net/nltr/vertex-white-logo.png" style="
                                max-width:179px;
                                width:100%;
                                display:block;
                                height:auto!important;
                                padding: 0px 0px; 
                                margin: 0px 0px; 
                                border: none;
                            " class="m_oci" width="179" align="center">
					</a>

					<p style="font-size: 12px;">&nbsp;</p>
        
              <!-- text/links below -->
              <p class="m_cfa" style="color:#b3b3b3;  font-family: Helvetica, sans-serif;">
                Was this forwarded to you?
              </p>
              <p class="m_cf" style="color:#666666;  font-family: Helvetica, sans-serif;">
                <a href="https://mailchi.mp/be09006e56a0/vertex-newsletter-signup" target="_blank" style="color:#ffffff; text-decoration: underline;">Subscribe for yourself</a>
              </p>
        <p style="font-size: 2px;">&nbsp;</p>
		</center>

  <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin: 0 auto;">
  <tr>
    <td align="center" style="padding: 0 10px;">
      <a href="https://vvus.com/news/" target="_blank" style="color:#b3b3b3; text-decoration: none; font-family: Georgia, Times, 'Times New Roman', serif;">News</a>
    </td>
    <td align="center" style="padding: 0 10px;">
      <a href="https://vvus.com/legal/" target="_blank" style="color:#b3b3b3; text-decoration: none; font-family: Georgia, Times, 'Times New Roman', serif;">Legal</a>
    </td>
    <td align="center" style="padding: 0 10px;">
      <a href="*|UNSUB|*" target="_blank" style="color:#b3b3b3; text-decoration: none; font-family: Georgia, Times, 'Times New Roman', serif;">Unsubscribe</a>
    </td>
  </tr>
</table>


    </td>
  </tr>
</table> 


</td>
</tr>


<tr>
    <td align="center" style="
            padding: 30px 20px 20px 20px; 
        " class="fot">
		<center>
            <p>
                <a href="https://vvus.com/" target="_blank" class="m_cf" rel="noreferrer" style="font-family: Georgia, Times, 'Times New Roman', serif; color:#2484C6;">
                    vvus.com
                </a>
            </p> 
            <p style="
                    color:#b3b3b3; 
                    font-family: Georgia, Times, 'Times New Roman', serif;
                ">
                    &copy; *|CURRENT_YEAR|*  Vertex Ventures | All Rights Reserved
            </p>

            <p style="
            color:#b3b3b3; 
            font-family: Georgia, Times, 'Times New Roman', serif;
        ">
           345 California Ave Palo Alto, CA 94306-1865 USA
    </p>
		</center>
    </td>
</tr>


</table>
<!-- end footer -->




                

<!-- outer container-->
                </td>
              </tr>
            </table>
            <!--[if (gte mso 9)|(IE)]>
          </td>
        </tr>
      </table>
      <![endif]-->
          </td>
        </tr>
      </table>
<!-- outer container-->

    </body>
</html>`;

export default emailTemplate;
