export default (token, user, request, origin, destination, stopCities) => {
  let baseUrl = null;
  let returnDate = null;

  if (process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development') {
    baseUrl = process.env.MAIL_URL_DEVELOPMENT;
  } else {
    baseUrl = process.env.MAIL_URL_PRODUCTION;
  }

  if (request.request_type === 'OneWay') returnDate = 'Not specified';
  else returnDate = request.return_date;

  if (stopCities.length < 2) stopCities = 'Not specified';

  return `<body style="font-family: sans-serif;">
     <div style="
     margin: auto;
     background-color: rgb(245, 245, 245);
     width: 650px;
     height: 400px;
     text-align: center;
     box-shadow: 0px 5px 15px 0px rgb(153, 153, 153, 0.5);
     border-radius: 8px;">

     <h4 style="color: rgb(93, 93, 93); font-size: 28px; padding-top: 40px;">Request trip confirmation</h4>
        <p style="text-align: left; margin-left: 30px; margin-top: 20px; color: rgb(93, 93, 93);">${user.firstname} has requested a trip from ${origin} to ${destination}</p>
        <p style="text-align: left; margin-left: 30px; margin-top: 20px; color: rgb(93, 93, 93);">Reason: ${request.reason}</p>
        <p style="text-align: left; margin-left: 30px; margin-top: 20px; color: rgb(93, 93, 93);">Stop cities: ${stopCities},</p>
        <p style="text-align: left; margin-left: 30px; margin-top: 20px; color: rgb(93, 93, 93);">Departure date: ${request.departure_date},</p>
        <p style="text-align: left; margin-left: 30px; margin-top: 20px; line-height: 0; color: rgb(93, 93, 93);">Return date date: ${returnDate}</p>

        <a style="background-color: rgb(54, 0, 179); /* Green */
            width: 120px;
            height: 16px;
            outline: none;
            border-radius: 360px;
            color: white;
            margin: 16px;
            padding: 15px 32px;
            text-align: center;
            text-decoration: none;
            display: inline-block;
            font-size: 14px;
            font-weight: bold;
            cursor: pointer;" href='${baseUrl}/api/v1/users/${user.id}/requests/${request.id}/approve/${token}'>CONFIRM</a>

        <a style="
            width: 120px;
            height: 16px;
            outline: none;
            border-radius: 360px;
            color: rgb(54, 0, 179);
            margin: 16px;
            padding: 15px 32px;
            text-align: center;
            text-decoration: none;
            display: inline-block;
            font-size: 14px;
            font-weight: bold;
            border: 1px solid rgb(54, 0, 179);
            cursor: pointer;" href='${baseUrl}/api/v1/users/${user.id}/requests/${request.id}/reject/${token}'>DECLINE</a>
   
   </div>
   </body>`;
};