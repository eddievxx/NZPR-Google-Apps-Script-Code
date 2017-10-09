///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  function onOpen() {
    
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    
    var newArrivalSheetMenu = [];
    newArrivalSheetMenu = [
      {name: "1. Sort", functionName: "sortNewArrivalSheet"},
      {name: "2. Move to Inbox_Sheet (if selected)", functionName: "moveNewArrivalsToInbox"}
    ];
    
    var inboxSheetMenu = [];
    inboxSheetMenu = [
      {name: "1. Sort", functionName: "sortList"},
      {name: "3. Check", functionName: "feeChecks"},
      {name: "4. Send to Xero", functionName: "sendToXero"},
      {name: "5. Create Client pdfs", functionName: "emailRemittanceAdvice"},
      {name: "6. Clear Inbox_Sheet", functionName: "clearInboxSheet"}
    ];
    
    var newClientMenu = [];
    newClientMenu = [
      {name: "1. Add Agent payment amounts", functionName: "newClientFees"},
      {name: "2. Add Sales Manager Payments (if any)", functionName: "salesManagerPayments"},
      {name: "(op) Add 'Bonus' Line", functionName: "bonusLine"},
      {name: "(op) Add 'Fuel Contribution' Line", functionName: "fuelContLine"},
      {name: "3. Make Payments in Xero (if selected)", functionName: "makeNewClientPayments"},
      {name: "4. Clear New_Client sheet (if selected)", functionName: "clearNewClientSheet"}
    ];
    
    var agentRemitMenu = [];
    agentRemitMenu = [
      {name: "1. Create Agent Remittance pfds", functionName: "emailAgentRemittanceAdvice"},
      {name: "2. Clear Agent_Remittance sheet", functionName: "clearAgentRemittanceSheet"}     
    ];
    
    ss.addMenu("New_Arrivals", newArrivalSheetMenu);
    ss.addMenu("Inbox_Sheet functions", inboxSheetMenu);
    ss.addMenu("New_Client functions", newClientMenu);
    ss.addMenu("Agent Remittance", agentRemitMenu);
    
  }



///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function sortList(){
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var firstSheet = ss.getSheetByName("Inbox_Sheet");
  var secondSheet = ss.getSheetByName("Merged_Sheet")
  
  var data = firstSheet.getDataRange().getValues();
  var ListOfFEDNumbers = secondSheet.getDataRange().getValues();
  
  var range = firstSheet.getRange("A2:Q1000");
  range.sort([{column: 1, ascending: true}, {column: 4, ascending: true}]);
  Browser.msgBox('Sort', 'List sorted (by client FED No. then Reference No.)', Browser.Buttons.OK);
}


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function removeDuplicates() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var firstSheet = ss.getSheetByName("Inbox_Sheet");
  var secondSheet = ss.getSheetByName("Merged_Sheet")
  
  //var sheet = SpreadsheetApp.getActiveSheet();
  var cells = firstSheet.getDataRange().getValues();
  var newData = new Array();
  for(i in cells){
    var row = cells[i];
    var duplicate = false;
    for(j in newData){
      if(row.join() == newData[j].join()){
        duplicate = true;
      }
    }
    if(!duplicate){
      newData.push(row);
    }
  }
  firstSheet.clearContents();
  firstSheet.getRange(1, 1, newData.length, newData[0].length).setValues(newData);
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function clearFirstSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var firstSheet = ss.getSheetByName("Inbox_Sheet");
  var secondSheet = ss.getSheetByName("Merged_Sheet");
  
  firstSheet.getRange(2, 1, firstSheet.getLastRow(), firstSheet.getLastColumn()).clear();

}


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function feeChecks() {
  var NZPRcommisionRate = 0.15;        //this is where the NZPR commision is set
  
  var ListOfFEDNumbers = [];
  
  var ss = SpreadsheetApp.getActiveSpreadsheet();   //naming the spreadsheet and sheets
  var firstSheet = ss.getSheetByName("Inbox_Sheet");
  var secondSheet = ss.getSheetByName("Merged_Sheet");
  
  firstSheet.getRange("N2").setFormula("=UNIQUE(A2:A)");
  firstSheet.getRange("O2").setFormula("=COUNTA(N2:N)");
  
  var numberOfFEDNumbers = firstSheet.getRange(2,15).getValues();
  
  var data = firstSheet.getDataRange().getValues();    //storing all the data on the page in an array for use in all calcs
  
   for(n=0; n < numberOfFEDNumbers; ++n){
    ListOfFEDNumbers[n] = data[n+1][13]; // 13 is the index of the column (starting from 0)
  }

  var targetFED;// = ListOfFEDNumbers[1][0];
  var BtotalCredit = new Array(numberOfFEDNumbers);
  var DreferenceNumber = new Array(numberOfFEDNumbers);
  var EclaimPeriod = new Array(numberOfFEDNumbers);
  var Ffee = new Array(numberOfFEDNumbers);
      
  for (var i = 0; i < numberOfFEDNumbers; i++) {
    BtotalCredit[i] = 0;
    DreferenceNumber[i] = ('| ').toString();
    EclaimPeriod[i] =  ('| ').toString();
    Ffee[i] = 0;
  }
  
  var CpaymentDate = [];
  var GclientName = [];
  var Hagent = [];
  var IagentCut = [];
  
  var JnzprCommission = [];
  var KclientRefund = [];
  var LagentCommission = [];
  
  var ClientsEmail = [];
  
  var maxRefund = []; //a variable to display the maximum variable allowable if the tax back isn't enough to cover their fee
   
  //for (var j = 1; j < ListOfFEDNumbers.length-1; j++){  //loop for each unique FED Number
  for (var j = 0; j < numberOfFEDNumbers; j++){  //loop for each unique FED Number
    targetFED = ListOfFEDNumbers[j];
    
    for (var i = 1; i < data.length; i++){   //loop for each line in the spreadsheet
      if(data[i][0] == targetFED){           //ensures the data stored in each of the following arrays is for each unique FED number
        BtotalCredit[j] = +BtotalCredit[j] + +data[i][1];
        CpaymentDate[j] = data[i][2];
        DreferenceNumber[j] += data[i][3] + " | ";
        EclaimPeriod[j] += data[i][4] + " | ";
        Ffee[j] += +data[i][5];
        GclientName[j] = data[i][6];
        Hagent[j] = data[i][7];
        IagentCut[j] = data[i][8];
        ClientsEmail[j] = data[i][12];
      }
      /*
      JnzprCommission[j] = BtotalCredit[j]*NZPRcommisionRate+Ffee[j];
      KclientRefund[j] = BtotalCredit[j]*(1-NZPRcommisionRate)-Ffee[j];
      LagentCommission[j] = BtotalCredit[j]*(IagentCut[j]/100);
      */
      JnzprCommission[j] = (BtotalCredit[j]/1.15)*NZPRcommisionRate+Ffee[j];
      KclientRefund[j] = (BtotalCredit[j]/1.15)*(1-NZPRcommisionRate)-Ffee[j];
      LagentCommission[j] = (BtotalCredit[j]/1.15)*(IagentCut[j]/100);
      
      //Sends to Logger
      ///*
      Logger.log(j+" "+i)
      Logger.log('targetFED: '        + targetFED);
      Logger.log('FED Number: '       + data[i][0]);
      Logger.log('TotalCredit: '      + data[i][1]);
      Logger.log('Payment Date: '     + data[i][2]);
      Logger.log('Reference Number: ' + data[i][3]);
      Logger.log('Claim Period: '     + data[i][4]);
      Logger.log('FEE: '              + Ffee[j]);
      Logger.log("SUM: "              + BtotalCredit[j]);
      Logger.log("RefNo: "            + DreferenceNumber[j]);
      Logger.log("Commision: "        + JnzprCommission[j]);
      Logger.log("Refund: "           + KclientRefund[j]);
      Logger.log("email: "            + ClientsEmail[j]);
      Logger.log("  ");
      //*/
    }
    maxRefund[j] = Ffee[j] + KclientRefund[j];//previously had 343.85 instead of Ffee[j] which caused errors when fee was changed.
    if(KclientRefund[j] < 0){
      Browser.msgBox('Fee Check', 'Fee will be too large for '+GclientName[j]+', current refund is '+KclientRefund[j]+'. Max refund is '+maxRefund[j]+'. Reduce the fee then run this Check again.', Browser.Buttons.OK);
      return;
    }

    if(ClientsEmail[j] == ""){
      Browser.msgBox('Email Address Check', 'No email address for '+GclientName[j]+', add their email to the Client sheet then run this Check again.', Browser.Buttons.OK);
      return;
    }
    
  }
  Browser.msgBox('Fee Check', 'All Refund amounts are positive & email addresses exist, you can now Send to Xero', Browser.Buttons.OK);
}



///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function emailRemittanceAdvice() {
  var NZPRcommisionRate = 0.15;        //this is where the NZPR commision is set
  var ListOfFEDNumbers = [];

  var ss = SpreadsheetApp.getActiveSpreadsheet(); //naming the spreadsheet and sheets
  var inboxSheet = ss.getSheetByName("Inbox_Sheet");
  var dataSheet = ss.getSheetByName("Data_Sheet");
  var templateSheet = ss.getSheetByName("Commision_Invoice");

  inboxSheet.getRange("N2").setFormula("=UNIQUE(A2:A)");
  inboxSheet.getRange("O2").setFormula("=COUNTA(N2:N)");
  
  var numberOfFEDNumbers = inboxSheet.getRange(2, 15).getValues();
  
  var data = inboxSheet.getDataRange().getValues(); //storing all the data on the inbox_sheet in an array for use in all calcs
  var refundData; //as above but from the refund template; when populated
  for (n = 0; n < numberOfFEDNumbers; ++n) {
    ListOfFEDNumbers[n] = data[n + 1][13]; // 13 is the index of the column (starting from 0)
  }
  
  var targetFED; // = ListOfFEDNumbers[1][0];
  
  var ClientsName = [];
  var ClientsEmail = [];
  var ClientsFirstName = [];
  
  var BtotalCredit = new Array(numberOfFEDNumbers);
  var Ffee = new Array(numberOfFEDNumbers);
      
  for (var i = 0; i < numberOfFEDNumbers; i++) {
    BtotalCredit[i] = 0;
    Ffee[i] = 0;
  }
  var KclientRefund = [];
  var JnzprCommission = [];
  var minimumCharge = [];
  


  var ClientsFee = new Array(numberOfFEDNumbers); //creates the array ClientsFee, with a length of numberOfFEDNumbers
  for (var i = 0; i < numberOfFEDNumbers; i++) {  //fills the array ClientsFee with 0s
    ClientsFee[i] = 0;
  }
  
  for (var j = 0; j < numberOfFEDNumbers; j++) { //loop for each unique FED Number to store the caluclated values
    targetFED = ListOfFEDNumbers[j];
    
    for (var i = 1; i < data.length; i++) { //loop for each line in the spreadsheet
      if (data[i][0] == targetFED) { //ensures the data stored in each of the following arrays is for each unique FED number
        
        BtotalCredit[j] = +BtotalCredit[j] + +data[i][1];
        
        ClientsName[j] = data[i][6];
        ClientsEmail[j] = data[i][12];
        ClientsFee[j] += data[i][5];
        ClientsFirstName[j] = data[i][16];
        minimumCharge[j] = data[i][17];
        var d = new Date();
        d.setHours(0, 0, 0, 0);
                
        dataSheet.appendRow([data[i][0],//writes data from the correct FED number only to the data_sheet
                             data[i][1],
                             data[i][2],
                             data[i][3],
                             data[i][4],
                             data[i][5],
                             data[i][6],
                             data[i][7],
                             data[i][8],
                             data[i][9],
                             data[i][10],
                             data[i][11],
                             data[i][12],
                             data[i][15],
                             ClientsFirstName[j],
                             d,
                             data[i][17]
                            ]);

        
        /*
        KclientRefund[j] = BtotalCredit[j]*(1-NZPRcommisionRate)-ClientsFee[j];
        KclientRefund[j] = KclientRefund[j].toFixed(2);
        */



        
        //new code with the minimum charge changes
      
        JnzprCommission[j] = (BtotalCredit[j]/1.15)*NZPRcommisionRate+Ffee[j];
      
        if (BtotalCredit[j]/1.15 < minimumCharge[j]){
          JnzprCommission[j] = BtotalCredit[j]/1.15;
        }      
        else if (minimumCharge[j] > JnzprCommission[j]){
          JnzprCommission[j] = minimumCharge[j];
        }
        else {
          JnzprCommission[j] = JnzprCommission[j];
        }
           
        KclientRefund[j] = (BtotalCredit[j]/1.15 - JnzprCommission[j]);   
        //KclientRefund[j] = (BtotalCredit[j]/1.15)*(1-NZPRcommisionRate)-ClientsFee[j];
        KclientRefund[j] = KclientRefund[j].toFixed(2);
        
        
        var clientRefundInclusive = (KclientRefund[j] * 1.15)-(ClientsFee[j]*1.15);
        clientRefundInclusive = clientRefundInclusive.toFixed(2);
        
        
      }

    }
    Logger.log(ClientsName[j]);
    Logger.log(ClientsEmail[j]);
    Logger.log(ClientsFee[j]);
    
    clearDataSheet();
    
    //PDF CONVERSION AND EMAIL SECTION OF CODE///////////////////////////////////////////                                                        
    var date = Utilities.formatDate(new Date(), "GMT+12", "dd-MM-yyyy'T'HH:mm:ss'Z'");
    
    // Send the PDF of the spreadsheet to this email address
    //var email = "bernard@nzpetrolrefunds.co.nz"; 
    var email = "nzprauto@gmail.com";
    
    // Subject of email message
    //var subject = ClientsName[j] +" Invoice(s) " + date.toString();
    var subject = ClientsEmail[j];
    var body;
    // Email Body can  be HTML too with your logo image - see ctrlq.org/html-mail
    //var body = ClientsName[j] +" Invoice(s) " + date.toString();
    
            //if (ClientsEmail[j] == "bernard@nzpetrolrefunds.co.nz") {     BERNARD WANTS IT TO BE ADMIN EMAIL ADDRESS 1 March 2017
            if (ClientsEmail[j] == "admin@nzpetrolrefunds.co.nz") {
            Logger.log("after if = bernard, clients email is " + ClientsEmail[j]);
            //code to email with the letter templates
            body = "Bernard, to print for " + ClientsName[j];
            var url = ss.getUrl();
            url = url.replace(/edit$/, '');
            var url_ext = 'export?exportFormat=pdf&format=pdf' // export as pdf / csv / xls / xlsx
                + '&size=letter' // paper size
                + '&portrait=true' // orientation, false for landscape
                + '&fitw=true&source=labnol' // fit to width, false for actual size
                + '&sheetnames=false&printtitle=false' // hide optional headers and footers
                + '&pagenumbers=false&gridlines=false' // hide page numbers and gridlines
                + '&fzr=false' // do not repeat row headers (frozen rows) on each page
                + '&gid='; // the sheet's Id
            var token = ScriptApp.getOAuthToken();
            var sheets = ss.getSheets();
            //make an empty array to hold your fetched blobs  
            var blobs = [];
            ///////////////////////////////////////////////////////////////
    
    if (ClientsFee[j] > 0) {//checks whether a fee is present to determine what invoices need to be sent HERE!!!
      
      
      
                      for (var i = 7; i < 8; i++) { //selecting sheet 7 to turn into pdf and email
                    // Convert individual worksheets to PDF
                    var response = cUseful.Utils.expBackoff(function() {
                        return UrlFetchApp.fetch(url + url_ext + sheets[i].getSheetId(), {
                            headers: {
                                'Authorization': 'Bearer ' + token
                            },
                            muteHttpExceptions: true,
                        });
                    }, {
                        logAttempts: true,
                        lookahead: function(r) {
                            return r.getResponseCode() === 429;
                        }
                    });
                    //convert the response to a blob and store in our array
                    //blobs[i] = response.getBlob().setName('Invoice ' + date.toString() + '.pdf');
                    blobs[i] = response.getBlob().setName(sheets[i].getName() + '.pdf');
                }
                if (MailApp.getRemainingDailyQuota() > 0) GmailApp.sendEmail(email, subject, body, {
                    attachments: [blobs[7].getAs(MimeType.PDF)],
                    name: 'NZ Petrol Refunds'
                });
            } else {
                for (var i = 8; i < 9; i++) { //selecting sheets 8 to turn into pdf and email
                    // Convert individual worksheets to PDF
                    var response = cUseful.Utils.expBackoff(function() {
                        return UrlFetchApp.fetch(url + url_ext + sheets[i].getSheetId(), {
                            headers: {
                                'Authorization': 'Bearer ' + token
                            },
                            muteHttpExceptions: true,
                        });
                    }, {
                        logAttempts: true,
                        lookahead: function(r) {
                            return r.getResponseCode() === 429;
                        }
                    });
                    //convert the response to a blob and store in our array
                    //blobs[i] = response.getBlob().setName('Invoice ' + date.toString() + '.pdf');
                    blobs[i] = response.getBlob().setName(sheets[i].getName() + '.pdf');
                }
                if (MailApp.getRemainingDailyQuota() > 0) GmailApp.sendEmail(email, subject, body, {
                    attachments: [blobs[8].getAs(MimeType.PDF)],
                    name: 'NZ Petrol Refunds'
                });
            }
        } else {
            if (ClientsFee[j] > 0) { //checks whether a fee is present to determine what invoices need to be sent 
      
      
      
      
      
      
      
      body = "Hi "+ClientsFirstName[j]+", \r\rGood news!\r\rWe've received your petrol refund from the NZTA and will be loading that up for payment into your bank account tonight.\r\rYour refund came to $"+clientRefundInclusive+".\r\rAttached to this email is a payment advice summary and our invoices.\r\rPlease note that our fees have been removed already so there is no need to take any action on these.\r\rMoving forward we will be putting a claim in on your behalf at the end of each financial quarter. We'll contact you to update our details in time for the next claim.\r\rRefer a mate - To help us reach as many people as we can we are offering you a bonus $50 on your next claim for any new client you refer through to us. Your mate gets $50 too. Just reply to this email with names and numbers and we'll give them a call.\r\rPlease let me know if you have any questions.\r\rKind regards,\r\rBernard Coogan\r\rDirector\r\rNZ Petrol Refunds Limited\r\rnzpetrolrefunds.co.nz\r\r021 2066 719";
      
          
    } else {
      body = "Hi "+ClientsFirstName[j]+", \r\rWe have received your latest refund from the NZTA and will be loading that up for payment into your account tonight.\r\rYour refund came to $"+clientRefundInclusive+".\r\rPlease see attached payment notice and invoice.\r\rRefer a mate - To help us reach as many people as we can we are offering you a bonus $50 on your next claim for any new client you refer through to us. Your mate gets $50 too. Just reply to this email with names and numbers and we'll give them a call.\r\rKind regards,\r\rBernard Coogan\r\rDirector\r\rNZ Petrol Refunds Limited\r\rnzpetrolrefunds.co.nz\r\r021 2066 719"
    }
    
        
    var url = ss.getUrl();
    url = url.replace(/edit$/, '');

    /* Specify PDF export parameters
    // From: https://code.google.com/p/google-apps-script-issues/issues/detail?id=3579
    exportFormat = pdf / csv / xls / xlsx
    gridlines = true / false
    printtitle = true (1) / false (0)
    size = legal / letter/ A4
    fzr (repeat frozen rows) = true / false
    portrait = true (1) / false (0)
    fitw (fit to page width) = true (1) / false (0)
    add gid if to export a particular sheet - 0, 1, 2,..
    */

    var url_ext = 'export?exportFormat=pdf&format=pdf' // export as pdf / csv / xls / xlsx
      + '&size=letter' // paper size
      + '&portrait=true' // orientation, false for landscape
      + '&fitw=true&source=labnol' // fit to width, false for actual size
      + '&sheetnames=false&printtitle=false' // hide optional headers and footers
      + '&pagenumbers=false&gridlines=false' // hide page numbers and gridlines
      + '&fzr=false' // do not repeat row headers (frozen rows) on each page
      + '&gid='; // the sheet's Id

    var token = ScriptApp.getOAuthToken();
    var sheets = ss.getSheets();

    //make an empty array to hold your fetched blobs  
    var blobs = [];

    ///////////////////////////////////////////////////////////////
    if (ClientsFee[j] > 0) {//checks whether a fee is present to determine what invoices need to be sent
    
      for (var i = 5; i < 6; i++) {//selecting sheet 5 to turn into pdf and email

        // Convert individual worksheets to PDF
        var response = cUseful.Utils.expBackoff(
          function() {
            return UrlFetchApp.fetch(url + url_ext + sheets[i].getSheetId(), {
              headers: {
                'Authorization': 'Bearer ' + token
              },
                muteHttpExceptions: true,
            });
          }, {
            logAttempts: true,
            lookahead: function(r) {
              return r.getResponseCode() === 429;
            }
          });

        //convert the response to a blob and store in our array
        //blobs[i] = response.getBlob().setName('Invoice ' + date.toString() + '.pdf');
        blobs[i] = response.getBlob().setName(sheets[i].getName() + '.pdf');
        
      }
      if (MailApp.getRemainingDailyQuota() > 0)
            GmailApp.sendEmail(email, subject, body, {
        attachments: [blobs[5].getAs(MimeType.PDF)],
        name: 'NZ Petrol Refunds'
      });
    }
    else {
      for (var i = 6; i < 7; i++) {//selecting sheets 6 to turn into pdf and email
        
        // Convert individual worksheets to PDF
        var response = cUseful.Utils.expBackoff(
          function() {
            return UrlFetchApp.fetch(url + url_ext + sheets[i].getSheetId(), {
                headers: {
                  'Authorization': 'Bearer ' + token
                },
                  muteHttpExceptions: true,
            });
          }, {
            logAttempts: true,
            lookahead: function(r) {
              return r.getResponseCode() === 429;
            }
          });
        
        //convert the response to a blob and store in our array
        //blobs[i] = response.getBlob().setName('Invoice ' + date.toString() + '.pdf');
        blobs[i] = response.getBlob().setName(sheets[i].getName() + '.pdf');
      }
      

      
      if (MailApp.getRemainingDailyQuota() > 0)
        GmailApp.sendEmail(email, subject, body, {
          attachments: [blobs[6].getAs(MimeType.PDF)],
          name: 'NZ Petrol Refunds'
        });
      
    }
        }
    //END OF PDF AND EMAIL SECTION OF CODE/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////      


  }

  //inboxSheet.getRange(2, 1, inboxSheet.getLastRow(), inboxSheet.getLastColumn()).clear();    //clears the sheet
  //Browser.msgBox('Done', 'The Invoice pdfs for each client have been created and sent.', Browser.Buttons.OK);
  Browser.msgBox('Done', 'The Invoice pdfs for each client have been created (and draft emails within 5 mins).', Browser.Buttons.OK);
}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////    
function clearInboxSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var inboxSheet = ss.getSheetByName("Inbox_Sheet");
    
  inboxSheet.getRange(2, 1, inboxSheet.getLastRow(), inboxSheet.getLastColumn()).clear();    //clears the sheet

}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////    
function clearDataSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var dataSheet = ss.getSheetByName("Data_Sheet");
    
  dataSheet.getRange(2, 1, dataSheet.getLastRow(), dataSheet.getLastColumn()).clear();

}
 
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//merges client's NZTA emails into one per client and sends to Xero, also copies individual lines for sending to Xero for NZTA invoices, aslo lines go to 
//Agent_Payment sheet to go to Xero, and to Agent_Remittance sheet for generating agent remittance advice
function sendToXero() {
  var NZPRcommisionRate = 0.15;        //this is where the NZPR commision is set
  
  var ListOfFEDNumbers = [];
  
  var ss = SpreadsheetApp.getActiveSpreadsheet();   //naming the spreadsheet and sheets
  var inboxSheet = ss.getSheetByName("Inbox_Sheet");
  var mergedSheet = ss.getSheetByName("Merged_Sheet");
  var singleSheet = ss.getSheetByName("Single_Sheet");
  var agentPaymentSheet = ss.getSheetByName("Agent_Payment");
  var AgentRemittanceSheet = ss.getSheetByName("Agent_Remittance");
  
  var clientSheet = ss.getSheetByName("Clients");
  var clientSheetData = clientSheet.getDataRange().getValues();
  var numberOfClientSheetDataRows = clientSheet.getLastRow();
    
  inboxSheet.getRange("N2").setFormula("=UNIQUE(A2:A)");
  inboxSheet.getRange("O2").setFormula("=COUNTA(N2:N)");
  
  var numberOfFEDNumbers = inboxSheet.getRange(2,15).getValues();
  
  var data = inboxSheet.getDataRange().getValues();    //storing all the data on the Inbox_Sheet page in an array for use in all calcs
  
  //sends a copy of each line to single sheet
  for (var k = 1; k < data.length; k++){//appends Single_Sheet with all the lines from Inbox_Sheet
  singleSheet.appendRow([data[k][0],
                  data[k][1],
                  data[k][2],
                  data[k][3],
                  data[k][4],
                  data[k][5],
                  data[k][6],
                  data[k][7],
                  data[k][8],
                 ]);
  }

  for(n=0; n < numberOfFEDNumbers; ++n){
    ListOfFEDNumbers[n] = data[n+1][13]; // 13 is the index of the column (starting from 0)
  }
  
  Logger.log(numberOfFEDNumbers);
  Logger.log(ListOfFEDNumbers);
  
  var targetFED;// = ListOfFEDNumbers[1][0];
  
  
  var BtotalCredit = new Array(numberOfFEDNumbers);
  var DreferenceNumber = new Array(numberOfFEDNumbers);
  var EclaimPeriod = new Array(numberOfFEDNumbers);
  var Ffee = new Array(numberOfFEDNumbers);
      
  for (var i = 0; i < numberOfFEDNumbers; i++) {
    BtotalCredit[i] = 0;
    DreferenceNumber[i] = '| ';
    EclaimPeriod[i] =  '| ';
    Ffee[i] = 0;
  }
  
  var CpaymentDate = [];
  var GclientName = [];
  var Hagent = [];
  var IagentCut = [];
    
  var minimumCharge = [];
  
  var JnzprCommission = [];
  var KclientRefund = [];
  var LagentCommission = [];
   
  //for (var j = 1; j < ListOfFEDNumbers.length-1; j++){  //loop for each unique FED Number
  for (var j = 0; j < numberOfFEDNumbers; j++){  //loop for each unique FED Number to store the caluclated values
    //targetFED = ListOfFEDNumbers[j][0];
    targetFED = ListOfFEDNumbers[j];
    
    
    for (var i = 1; i < data.length; i++){   //loop for each line in the spreadsheet
      
      
      //merges data
      if(data[i][0] == targetFED){           //ensures the data stored in each of the following arrays is for each unique FED number
        BtotalCredit[j] = +BtotalCredit[j] + +data[i][1];
        CpaymentDate[j] = data[i][2];
        DreferenceNumber[j] += data[i][3] + " | ";
        EclaimPeriod[j] += data[i][4] + " | ";
        Ffee[j] += +data[i][5];
        GclientName[j] = data[i][6];
        Hagent[j] = data[i][7];
        IagentCut[j] = data[i][8];
        minimumCharge[j] = data[i][17];
      }
      
      
      //JnzprCommission[j] = (BtotalCredit[j]/1.15)*NZPRcommisionRate+Ffee[j];
      //KclientRefund[j] = (BtotalCredit[j]/1.15)*(1-NZPRcommisionRate)-Ffee[j];
      
      
      //new code with the minimum charge changes
      
      JnzprCommission[j] = (BtotalCredit[j]/1.15)*NZPRcommisionRate+Ffee[j];
      
      if (BtotalCredit[j]/1.15 < minimumCharge[j]){
        JnzprCommission[j] = BtotalCredit[j]/1.15;
      }      
      else if (minimumCharge[j] > JnzprCommission[j]){
        JnzprCommission[j] = minimumCharge[j];
      }
      else {
        JnzprCommission[j] = JnzprCommission[j];
      }
      
      KclientRefund[j] = (BtotalCredit[j]/1.15 - JnzprCommission[j]);   
      
      
      
      
      //LagentCommission[j] = (BtotalCredit[j]/1.15)*(IagentCut[j]/100); //no longer used (an old change, perhaps this was never used?)
      
    }
    

  }
  //mergedSheet.getRange(2, 1, mergedSheet.getLastRow(), mergedSheet.getLastColumn()).clear();    //clears the 2nd sheet immediately prior to data being written to it
  for (var k = 0; k < numberOfFEDNumbers; k++){
    
    //sends merged data to merged_sheet
    mergedSheet.appendRow([ListOfFEDNumbers[k],
                           BtotalCredit[k],
                           CpaymentDate[k],
                           DreferenceNumber[k],
                           EclaimPeriod[k],
                           Ffee[k],
                           GclientName[k],
                           Hagent[k],
                           IagentCut[k],
                           JnzprCommission[k],
                           KclientRefund[k]
                          ]);
    
    //sends merged data & data for bill payments to Xero to agent_payment sheet
    agentPaymentSheet.appendRow([ListOfFEDNumbers[k],                                                  //FED No.
                                 BtotalCredit[k],                                                      //TOtal Credit
                                 CpaymentDate[k],                                                      //Payment Date
                                 DreferenceNumber[k],                                                  //Reference Number
                                 EclaimPeriod[k],                                                      //Claim Period
                                 Ffee[k],                                                              //Fee
                                 GclientName[k],                                                       //Client
                                 Hagent[k],                                                            //Agent Name
                                 IagentCut[k],                                                         //Agent Cut %
                                 "=VLOOKUP(AP_RangeH,Agents!$C$2:$M,11,0)",                            //GST Registered Y/N
                                 "=VLOOKUP(AP_RangeH,Agents!$C$2:$N,12,0)",                            //WT Registered Y/N
                                 "=(AP_RangeB/1.15)*(AP_RangeI/100)",                                  //Agent Commission Unit Price
                                 "Agent Commission",                                                   //Payment/Commission Description  
                                 '="Commision on " & AP_RangeG & " for period(s) " & AP_RangeE',       //Description - Commission
                                 "Withholding Tax",                                                    //Description - WT
                                 "1",                                                                  //Qty - Commission
                                 '=AP_RangeL',                                                         //Qty - WT
                                 '=AP_RangeL',                                                         //Unit Price - Commission
                                 '=IF(AP_RangeK="Y",VLOOKUP(AP_RangeH,Agents!$C$2:$V,20,0)/(-100),"0")',   //Unit Price - WT                      
                                 "455",                                                                //Acc Code - Commission - Agent
                                 'WT',                                                                 //Acc Code - WT
                                 '="INPUT2"',                                                          //Tax Rate - Commision
                                 'NONE',                                                               //Tax Rate - WT
                                 '=IF(AP_RangeJ = "N","NoTax","Exclusive")',                           //*Tax Type 
                                 '=VLOOKUP(Agent_Payment!AP_RangeH,Agents!$C$2:$S,17,0)'               //agent active
                                ]);
    
    
    AgentRemittanceSheet.appendRow([ListOfFEDNumbers[k],                                                  //FED No.
                                 BtotalCredit[k],                                                      //TOtal Credit
                                 CpaymentDate[k],                                                      //Payment Date
                                 DreferenceNumber[k],                                                  //Reference Number
                                 EclaimPeriod[k],                                                      //Claim Period
                                 Ffee[k],                                                              //Fee
                                 GclientName[k],                                                       //Client
                                 Hagent[k],                                                            //Agent Name
                                 IagentCut[k],                                                         //Agent Cut %
                                 "=VLOOKUP(AI_RangeH,Agents!$C$2:$M,11,0)",                            //GST Registered Y/N
                                 "=VLOOKUP(AI_RangeH,Agents!$C$2:$N,12,0)",                            //WT Registered Y/N
                                 "=(AI_RangeB/1.15)*(AI_RangeI/100)",                                  //Agent Commission Unit Price
                                 "Agent Commission",                                                   //Payment/Commission Description  
                                 '="Commision on " & AI_RangeG & " for period(s) " & AI_RangeE',       //Description - Commission
                                 "Withholding Tax",                                                    //Description - WT
                                 "1",                                                                  //Qty - Commission
                                 '=AI_RangeL',                                                         //Qty - WT
                                 '=AI_RangeL',                                                         //Unit Price - Commission
                                 '=IF(AP_RangeK="Y",VLOOKUP(AP_RangeH,Agents!$C$2:$V,20,0)/(-100),"0")',   //Unit Price - WT                      
                                 "455",                                                                //Acc Code - Commission - Agent
                                 'WT',                                                                 //Acc Code - WT
                                 '="INPUT2"',                                                          //Tax Rate - Commision
                                 'NONE',                                                               //Tax Rate - WT
                                 '=IF(AI_RangeJ = "N","NoTax","Exclusive")',                           //*Tax Type 
                                 '=VLOOKUP(AI_RangeH,Agents!$C$2:$J,8,0)',                             //agents email address
                                 '=SPLIT(AI_RangeH," ")'                                               //agents first (alnd last) name, spit
                                ]);
    
    
    //sends Sales Manager recurring payments to agent_payment sheet (for Xero)

    var salesManagerPercent = 1;
    var salesManager = "Simon Hanrahan";
    var salesManagerStartDate = new Date('11/21/2016');
    //Logger.log("sm srt date: "+salesManagerStartDate);
       
    for (var z = 0; z < numberOfClientSheetDataRows; z++){ 
      if (clientSheetData[z][14] == salesManager && clientSheetData[z][1] == GclientName[k]){
        //Logger.log("equals: "+clientSheetData[z][14]);
      
        var approvedDate = new Date(clientSheetData[z][13]);
        //Logger.log("appr. date: " +approvedDate);
     
        if (DateDiff.inDays(salesManagerStartDate, approvedDate) >= 0){
          //Logger.log(approvedDate + " is on or after " +salesManagerStartDate);
          agentPaymentSheet.appendRow([ListOfFEDNumbers[k],
                                       BtotalCredit[k],
                                       CpaymentDate[k],
                                       DreferenceNumber[k],
                                       EclaimPeriod[k],
                                       Ffee[k],
                                       GclientName[k],                                        //Client
                                       salesManager,                                          //Sales Manager's Name in Agent column
                                       salesManagerPercent,                                   //Sales Manager's % in Agent cut % column
                                       "=VLOOKUP(AP_RangeH,Agents!$C$2:$M,11,0)",                            //GST Registered Y/N
                                       "=VLOOKUP(AP_RangeH,Agents!$C$2:$N,12,0)",                            //WT Registered Y/N
                                       "=(AP_RangeB/1.15)*(AP_RangeI/100)",                                  //Agent Commission Unit Price
                                       "Sales Manager Commission",                                           //Payment/Commission Description 
                                       '="Sales Managers Commision on " & AP_RangeG & " for period(s) " & AP_RangeE',       //Description - Commission
                                       "Withholding Tax",                                                    //Description - WT
                                       "1",                                                                  //Qty - Commission
                                       '=AP_RangeL',                                                         //Qty - WT
                                       '=AP_RangeL',                                                         //Unit Price - Commission
                                       '=IF(AP_RangeK="Y",VLOOKUP(AP_RangeH,Agents!$C$2:$V,20,0)/(-100),"0")',   //Unit Price - WT                      
                                       "457",                                                                //Acc Code - Commission - SalesManager
                                       'WT',                                                                 //Acc Code - WT
                                       '="INPUT2"',                                                          //Tax Rate - Commision
                                       'NONE',                                                               //Tax Rate - WT
                                       '=IF(AP_RangeJ = "N","NoTax","Exclusive")',                           //*Tax Type
                                       '=VLOOKUP(Agent_Payment!AP_RangeH,Agents!$C$2:$S,17,0)'               //agent active
                                      ]);
          
          AgentRemittanceSheet.appendRow([ListOfFEDNumbers[k],
                                       BtotalCredit[k],
                                       CpaymentDate[k],
                                       DreferenceNumber[k],
                                       EclaimPeriod[k],
                                       Ffee[k],
                                       GclientName[k],                                        //Client
                                       salesManager,                                          //Sales Manager's Name in Agent column
                                       salesManagerPercent,                                   //Sales Manager's % in Agent cut % column
                                       "=VLOOKUP(AI_RangeH,Agents!$C$2:$M,11,0)",                            //GST Registered Y/N
                                       "=VLOOKUP(AI_RangeH,Agents!$C$2:$N,12,0)",                            //WT Registered Y/N
                                       "=(AI_RangeB/1.15)*(AI_RangeI/100)",                                  //Agent Commission Unit Price
                                       "Sales Manager Commission",                                           //Payment/Commission Description 
                                       '="Sales Managers Commision on " & AI_RangeG & " for period(s) " & AI_RangeE',       //Description - Commission
                                       "Withholding Tax",                                                    //Description - WT
                                       "1",                                                                  //Qty - Commission
                                       '=AI_RangeL',                                                         //Qty - WT
                                       '=AI_RangeL',                                                         //Unit Price - Commission
                                       '=IF(AP_RangeK="Y",VLOOKUP(AP_RangeH,Agents!$C$2:$V,20,0)/(-100),"0")',   //Unit Price - WT                      
                                       "457",                                                                //Acc Code - Commission - SalesManager
                                       'WT',                                                                 //Acc Code - WT
                                       '="INPUT2"',                                                          //Tax Rate - Commision
                                       'NONE',                                                               //Tax Rate - WT
                                       '=IF(AI_RangeJ = "N","NoTax","Exclusive")',                            //*Tax Type 
                                       '=VLOOKUP(AI_RangeH,Agents!$C$2:$J,8,0)',                             //agents email address
                                       '=SPLIT(AI_RangeH," ")'                                               //agents first (alnd last) name, spit
                                       
                                      ]);
          
          
        }
      }
    }
    //sends Finder's recurring payments to agent_payment sheet (for Xero)
    
    var finder = "Murray Nash";
    var findersPercent = 1;
    
    for (var z = 0; z < numberOfClientSheetDataRows; z++){ 
       if (clientSheetData[z][15] == finder && clientSheetData[z][1] == GclientName[k]){
         Logger.log("finder: " + clientSheetData[z][15]);
         agentPaymentSheet.appendRow([ListOfFEDNumbers[k],//to agent payment sheet to send to Xero
                                      BtotalCredit[k],
                                      CpaymentDate[k],
                                      DreferenceNumber[k],
                                      EclaimPeriod[k],
                                      Ffee[k],
                                      GclientName[k],                                                       //Client
                                      finder,                                                            //Finder's Name in Agent column
                                      findersPercent,                                                       //Finder's % in Agent cut % column
                                      "=VLOOKUP(AP_RangeH,Agents!$C$2:$M,11,0)",                            //GST Registered Y/N
                                      "=VLOOKUP(AP_RangeH,Agents!$C$2:$N,12,0)",                            //WT Registered Y/N
                                      "=(AP_RangeB/1.15)*(AP_RangeI/100)",                                  //Agent Commission Unit Price
                                      "Finder's Commission",                                                //Payment/Commission Description 
                                      '="Finder\'s Commission on " & AP_RangeG & " for period(s) " & AP_RangeE',       //Description - Commission
                                      "Withholding Tax",                                                    //Description - WT
                                      "1",                                                                  //Qty - Commission
                                      '=AP_RangeL',                                                         //Qty - WT
                                      '=AP_RangeL',                                                         //Unit Price - Commission
                                      '=IF(AP_RangeK="Y",VLOOKUP(AP_RangeH,Agents!$C$2:$V,20,0)/(-100),"0")',   //Unit Price - WT                      
                                      "456",                                                                //Acc Code - Commission - Finder
                                      'WT',                                                                 //Acc Code - WT
                                      '="INPUT2"',                                                          //Tax Rate - Commision
                                      'NONE',                                                               //Tax Rate - WT
                                      '=IF(AP_RangeJ = "N","NoTax","Exclusive")',                           //*Tax Type
                                      '=VLOOKUP(Agent_Payment!AP_RangeH,Agents!$C$2:$S,17,0)'               //agent active
                                     ]);
         
         AgentRemittanceSheet.appendRow([ListOfFEDNumbers[k],//to agent interim sheet to hold for creating remittance advice
                                      BtotalCredit[k],
                                      CpaymentDate[k],
                                      DreferenceNumber[k],
                                      EclaimPeriod[k],
                                      Ffee[k],
                                      GclientName[k],                                                       //Client
                                      finder,                                                               //Finder's Name in Agent column
                                      findersPercent,                                                       //Finder's % in Agent cut % column
                                      "=VLOOKUP(AI_RangeH,Agents!$C$2:$M,11,0)",                            //GST Registered Y/N
                                      "=VLOOKUP(AI_RangeH,Agents!$C$2:$N,12,0)",                            //WT Registered Y/N
                                      "=(AI_RangeB/1.15)*(AI_RangeI/100)",                                  //Agent Commission Unit Price
                                      "Finder's Commission",                                                //Payment/Commission Description 
                                      '="Finder\'s Commission on " & AI_RangeG & " for period(s) " & AI_RangeE',       //Description - Commission
                                      "Withholding Tax",                                                    //Description - WT
                                      "1",                                                                  //Qty - Commission
                                      '=AI_RangeL',                                                         //Qty - WT
                                      '=AI_RangeL',                                                         //Unit Price - Commission
                                      '=IF(AP_RangeK="Y",VLOOKUP(AP_RangeH,Agents!$C$2:$V,20,0)/(-100),"0")',   //Unit Price - WT                      
                                      "456",                                                                //Acc Code - Commission - Finder
                                      'WT',                                                                 //Acc Code - WT
                                      '="INPUT2"',                                                          //Tax Rate - Commision
                                      'NONE',                                                               //Tax Rate - WT
                                      '=IF(AI_RangeJ = "N","NoTax","Exclusive")',                            //*Tax Type 
                                      '=VLOOKUP(AI_RangeH,Agents!$C$2:$J,8,0)',                             //agents email address
                                      '=SPLIT(AI_RangeH," ")'                                               //agents first (alnd last) name, split
                                     ]);
         
       }
    }
  
  }  
    Browser.msgBox('Send to Xero', 'The payment information has been sent to Xero.', Browser.Buttons.OK);
  
  }
var DateDiff = {    
    inDays: function(d1, d2) {
        var t2 = d2.getTime();
        var t1 = d1.getTime();

        return parseInt((t2-t1)/(24*3600*1000));
    },
    inWeeks: function(d1, d2) {
        var t2 = d2.getTime();
        var t1 = d1.getTime();

        return parseInt((t2-t1)/(24*3600*1000*7));
    },
    inMonths: function(d1, d2) {
        var d1Y = d1.getFullYear();
        var d2Y = d2.getFullYear();
        var d1M = d1.getMonth();
        var d2M = d2.getMonth();

        return (d2M+12*d2Y)-(d1M+12*d1Y);
    },
    inYears: function(d1, d2) {
        return d2.getFullYear()-d1.getFullYear();
    }
}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
 //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  function newClientFees(){
    
    var ss = SpreadsheetApp.getActiveSpreadsheet();


    
    var newClientsSheet = ss.getSheetByName("New_Clients");
    var agentsSheet = ss.getSheetByName("Agents")
    
    var newClientData = newClientsSheet.getDataRange().getValues();
    var agentSheetData = agentsSheet.getDataRange().getValues();
    
    var newClientAgentName = new String();

    var numberOfNewClientRows = newClientsSheet.getLastRow();
    //Logger.log("numberOfNewClientRows: "+numberOfNewClientRows);
    var numberOfAgentSheetRows = agentsSheet.getLastRow();
    //Logger.log("numberOfAgentSheetRows: "+numberOfAgentSheetRows);    
    
    var amount = 0;
    
    for (var i = 0; i < numberOfNewClientRows; i++) { 
      newClientAgentName = newClientData[i][2]; 
            
      if (newClientData[i][3] == "Telemarketed"){
        Logger.log('type(lead): ' +newClientData[i][3]);
        for (var j = 0; j < numberOfAgentSheetRows; j++) { //looping through each line in agent sheet
          if (agentSheetData[j][2] == newClientAgentName){//if the agent name in the agent sheet matches the agent name in the New client sheet...
            amount = agentSheetData[j][14];//stores the value in the Telemarketed column into variable amount
            newClientsSheet.getRange(i+1,5).setValue(amount);//sets the value of the variable amount to the amount column (col4) of New_Clients sheet
          }
        }
      }
      
      if (newClientData[i][3] == "Self-Generated"){
        Logger.log('type(lead): ' +newClientData[i][3]);
        for (var j = 0; j < numberOfAgentSheetRows; j++) { //looping through each line in agent sheet
          if (agentSheetData[j][2] == newClientAgentName){//if the agent name in the agent sheet matches the agent name in the New client sheet...
            amount = agentSheetData[j][15];//stores the value in the Self-Generated column into variable amount
            newClientsSheet.getRange(i+1,5).setValue(amount);//sets the value of the variable amount to the amount column (col4) of New_Clients sheet
          }
        }
      }
      
      if (newClientData[i][3] == "Finders Fee"){
        Logger.log('type(lead): ' +newClientData[i][3]);
        for (var j = 0; j < numberOfAgentSheetRows; j++) { //looping through each line in agent sheet
          if (agentSheetData[j][2] == newClientAgentName){//if the agent name in the agent sheet matches the agent name in the New client sheet...
            amount = agentSheetData[j][16];//stores the value in the Finders Fee column into variable amount
            newClientsSheet.getRange(i+1,5).setValue(amount);//sets the value of the variable amount to the amount column (col4) of New_Clients sheet
          }
        }
      }
    } 
  }
  
  ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//this function is used in the New_Client sheet, it adds a new payment line to the sales manager for each Self-Generated line on the page
  function salesManagerPayments(){
    var salesManagerName = "Simon Hanrahan";
    var salesManagerPayment = 20;
    
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var newClientsSheet = ss.getSheetByName("New_Clients");
    
    //takes all the data on the page
    var newClientData = newClientsSheet.getDataRange().getValues();
    var numberOfNewClientRows = newClientsSheet.getLastRow();
    
    //loops through it all looking for type self-gen
    for (var i = 0; i < numberOfNewClientRows; i++) { 
      if (newClientData[i][3] == "Self-Generated"){
        
        //copies that line and adds it to a new line with simons name and $20 (as 2 variables)
        newClientsSheet.appendRow(["Y",
                                   newClientData[i][1],
                                   salesManagerName,
                                   "Sales Manager",
                                   salesManagerPayment
                                  ]);
      
      }
    }
    // removes blank lines
    var sheet = SpreadsheetApp.getActiveSheet();
    var rows = sheet.getDataRange();
    var numRows = rows.getNumRows();
    var values = rows.getValues();
    
    var rowsDeleted = 0;
    for (var i = 1; i <= numRows - 1; i++) {//i=1 so row 0 (the headers) are not deleted
      var row = values[i];
      if (row[0] == '' && row[1] == '' && row[2] == '' && row[3] == '' && row[4] == '') {//checks all columns are blank
        sheet.deleteRow((parseInt(i)+1) - rowsDeleted);
        rowsDeleted++;
      }
    }
  }
  ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  //this function adds an extra line to the New_Client sheet with the 'type' set as Bonus
 
  function bonusLine(){
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var newClientsSheet = ss.getSheetByName("New_Clients");
    newClientsSheet.appendRow(["Y",
                               "",
                               "",
                               "Bonus",
                               ""
                              ]);
    
    // removes blank lines
    var sheet = SpreadsheetApp.getActiveSheet();
    var rows = sheet.getDataRange();
    var numRows = rows.getNumRows();
    var values = rows.getValues();
    
    var rowsDeleted = 0;
    for (var i = 1; i <= numRows - 1; i++) {//i=1 so row 0 (the headers) are not deleted
      var row = values[i];
      if (row[0] == '' && row[1] == '' && row[2] == '' && row[3] == '' && row[4] == '') {//checks all columns are blank
        sheet.deleteRow((parseInt(i)+1) - rowsDeleted);
        rowsDeleted++;
      }
    }
    
  }
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  //this function adds an extra line to the New_Client sheet with the 'type' set as Fuel Contribution

  function fuelContLine(){
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var newClientsSheet = ss.getSheetByName("New_Clients");
    newClientsSheet.appendRow(["Y",
                               "",
                               "",
                               "Fuel Contribution",
                               ""
                              ]);
    
    // removes blank lines
    var sheet = SpreadsheetApp.getActiveSheet();
    var rows = sheet.getDataRange();
    var numRows = rows.getNumRows();
    var values = rows.getValues();
    
    var rowsDeleted = 0;
    for (var i = 1; i <= numRows - 1; i++) {//i=1 so row 0 (the headers) are not deleted
      var row = values[i];
      if (row[0] == '' && row[1] == '' && row[2] == '' && row[3] == '' && row[4] == '') {//checks all columns are blank
        sheet.deleteRow((parseInt(i)+1) - rowsDeleted);
        rowsDeleted++;
      }
    }
  }
  
 
  ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  //this function takes (approved/checked) lines from the New_Client sheet and writes them to the interim_data sheet & agent_payment sheet 
  //
  
  function makeNewClientPayments(){
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var newClientsSheet = ss.getSheetByName("New_Clients");
    var AgentRemittanceSheet = ss.getSheetByName("Agent_Remittance");
    var agentPaymentSheet = ss.getSheetByName("Agent_Payment");
    
    var newClientData = newClientsSheet.getDataRange().getValues();
    var numberOfNewClientRows = newClientsSheet.getLastRow();
    
    for (var i = 1; i < numberOfNewClientRows; i++) { 
      if (newClientData[i][0] != ""){//checks if the row is marked/checked/approved
       
    
        
        agentPaymentSheet.appendRow(["",//sends the line to agent_payment sheet                 Blank (FED No.)
                                     "",
                                     "",
                                     "",
                                     "",
                                     "",
                                     newClientData[i][1],                                    // Client Name
                                     newClientData[i][2],                                    // Agent
                                     "",                                                     // Blank (Agent Cut %)
                                     "=VLOOKUP(AP_RangeH,Agents!$C$2:$M,11,0)",              // GST Registered Y/N
                                     "=VLOOKUP(AP_RangeH,Agents!$C$2:$N,12,0)",              // WT Registered Y/N
                                     newClientData[i][4],                                    // Unit Price
                                     newClientData[i][3],                                    // New Client Description
                                     '=IF(AP_RangeM = "Bonus",AP_RangeM&" Payment", IF(AP_RangeM = "Fuel Contribution",AP_RangeM&" Payment",AP_RangeM&" New Client Registration for "&AP_RangeG))', // Description - Commission
                                     "Withholding Tax",                                      // Description - WT
                                     "1",                                                                  //Qty - Commission
                                     '=AP_RangeL',                                                         //Qty - WT
                                     '=AP_RangeL',                                                         //Unit Price - Commission
                                     '=IF(AP_RangeK="Y",VLOOKUP(AP_RangeH,Agents!$C$2:$V,20,0)/(-100),"0")',   //Unit Price - WT                      
                                     '=If(AP_RangeM ="Telemarketed","4201",IF(AP_RangeM = "Self-Generated","4202",IF(AP_RangeM = "Sales Manager", "4301",IF(AP_RangeM = "Bonus","4401",IF(AP_RangeM = "Fuel Contribution","4402",IF(AP_RangeM = "Finders Fee","4302","455"))))))',                                                                //Acc Code - Commission
                                     'WT',                                                                 //Acc Code - WT
                                     '="INPUT2"',                                                          //Tax Rate - Commision
                                     'NONE',                                                               //Tax Rate - WT
                                     '=IF(AP_RangeJ = "N","NoTax","Exclusive")',                           //*Tax Type 
                                     '=VLOOKUP(Agent_Payment!AP_RangeH,Agents!$C$2:$S,17,0)'               //agent active
                                    ]);
                
        AgentRemittanceSheet.appendRow(["",//sends the line to agent_payment sheet                 Blank (FED No.)
                                     "",
                                     "",
                                     "",
                                     "",
                                     "",
                                     newClientData[i][1],                                    // Client Name
                                     newClientData[i][2],                                    // Agent
                                     "",                                                     // Blank (Agent Cut %)
                                     "=VLOOKUP(AI_RangeH,Agents!$C$2:$M,11,0)",              // GST Registered Y/N
                                     "=VLOOKUP(AI_RangeH,Agents!$C$2:$N,12,0)",              // WT Registered Y/N
                                     newClientData[i][4],                                    // Unit Price
                                     newClientData[i][3],                                    // New Client Description
                                     '=IF(AI_RangeM = "Bonus",AI_RangeM&" Payment", IF(AI_RangeM = "Fuel Contribution",AI_RangeM&" Payment",AI_RangeM&" New Client Registration for "&AI_RangeG))', // Description - Commission
                                     "Withholding Tax",                                      // Description - WT
                                     "1",                                                                  //Qty - Commission
                                     '=AI_RangeL',                                                         //Qty - WT
                                     '=AI_RangeL',                                                         //Unit Price - Commission
                                     '=IF(AP_RangeK="Y",VLOOKUP(AP_RangeH,Agents!$C$2:$V,20,0)/(-100),"0")',   //Unit Price - WT                      
                                     '=If(AI_RangeM ="Telemarketed","4201",IF(AI_RangeM = "Self-Generated","4202",IF(AI_RangeM = "Sales Manager", "4301",IF(AI_RangeM = "Bonus","4401",IF(AI_RangeM = "Fuel Contribution","4402",IF(AI_RangeM = "Finders Fee","4302","455"))))))',                                                                //Acc Code - Commission
                                     'WT',                                                                 //Acc Code - WT
                                     '="INPUT2"',                                                          //Tax Rate - Commision
                                     'NONE',                                                               //Tax Rate - WT
                                     '=IF(AI_RangeJ = "N","NoTax","Exclusive")',                            //*Tax Type 
                                     '=VLOOKUP(AI_RangeH,Agents!$C$2:$J,8,0)',                             //agents email address
                                     '=SPLIT(AI_RangeH," ")'                                               //agents first (alnd last) name, split
                                    ]);
        
        
        
      }
    }
  }



  ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  function clearNewClientSheet() {
    var sheet = SpreadsheetApp.getActiveSheet();
    var rows = sheet.getDataRange();
    var numRows = rows.getNumRows();
    var values = rows.getValues();
    
    var rowsDeleted = 0;
    for (var i = 1; i <= numRows - 1; i++) {//i=1 so row 0 (the headers) are not deleted
      var row = values[i];
      if (row[0] != '') {//checks to make sure only rows with something in the first column are selected
        sheet.deleteRow((parseInt(i)+1) - rowsDeleted);
        rowsDeleted++;
      }
    }
  }
    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function emailAgentRemittanceAdvice() {
  //var NZPRcommisionRate = 0.15;        //this is where the NZPR commision is set
  var ListOfAgents = [];

  var ss = SpreadsheetApp.getActiveSpreadsheet(); //naming the spreadsheet and sheets
  var AgentRemittanceSheet = ss.getSheetByName("Agent_Remittance");
  var agentDataSheet = ss.getSheetByName("Agent_Data");
  var agentTemplateSheet = ss.getSheetByName("Agent_Remit");
  var salesTemplateSheet = ss.getSheetByName("Sales_Remit");

  AgentRemittanceSheet.getRange("AB2").setFormula("=UNIQUE(H2:H)");
  AgentRemittanceSheet.getRange("AC2").setFormula("=COUNTA(AB2:AB)");
  
  var numberOfAgents = AgentRemittanceSheet.getRange(2, 29).getValues(); //get the value of the count formula from AB2, above
  
  var data = AgentRemittanceSheet.getDataRange().getValues(); //storing all the data on the interim sheet in an array for use in all calcs
  //var refundData; //as above but from the refund template; when populated
  for (n = 0; n < numberOfAgents; ++n) {
    ListOfAgents[n] = data[n + 1][27]; // 27 is the index of column AB (starting from 0)
  }
  
  var targetAgent;

  var agentsName = [];
  var agentsEmail = [];
  var agentsFirstName = [];  
  
  /*
  var BtotalCredit = new Array(numberOfFEDNumbers);
  var Ffee = new Array(numberOfFEDNumbers);
      
  for (var i = 0; i < numberOfFEDNumbers; i++) {
    BtotalCredit[i] = 0;
    Ffee[i] = 0;
  }
  var KclientRefund = [];
  


  var ClientsFee = new Array(numberOfFEDNumbers); //creates the array ClientsFee, with a length of numberOfFEDNumbers
  for (var i = 0; i < numberOfFEDNumbers; i++) {  //fills the array ClientsFee with 0s
    ClientsFee[i] = 0;
  }
  */
  Logger.log(numberOfAgents);
  Logger.log(ListOfAgents);
  
  
  
  for (var j = 0; j < numberOfAgents; j++) { //loop for each unique agent to store the caluclated values
    targetAgent = ListOfAgents[j];
    
    Logger.log("target agent " + targetAgent);
    Logger.log("agent in list " + ListOfAgents[j]);
    
    for (var i = 1; i < data.length; i++) { //loop for each line in the spreadsheet
      if (data[i][7] == targetAgent) { //ensures the data stored in each of the following arrays is for each unique agent
        
        Logger.log(data[i][7] + " matches " + targetAgent);
        //BtotalCredit[j] = +BtotalCredit[j] + +data[i][1];
        
        agentDataSheet.appendRow([data[i][0],//writes data from the correct FED number only to the data_sheet
                                  data[i][1],
                                  data[i][2],
                                  data[i][3],
                                  data[i][4],
                                  data[i][5],
                                  data[i][6],
                                  data[i][7],
                                  data[i][8],
                                  data[i][9],
                                  data[i][10],
                                  data[i][11],
                                  data[i][12],
                                  data[i][13],
                                  data[i][14],
                                  data[i][15],
                                  data[i][16],
                                  data[i][17],
                                  data[i][18],
                                  data[i][19],
                                  data[i][20],
                                  data[i][21],
                                  data[i][22],
                                  data[i][23],
                                  data[i][24],
                                  data[i][25]                                  
                                  
                                 ]);
        
        agentsName[j] = data[i][7];
        agentsEmail[j] = data[i][24];
        agentsFirstName[j] = data[i][25]; 
        
        /*
        ClientsName[j] = data[i][6];
        ClientsEmail[j] = data[i][12];
        ClientsFee[j] += data[i][5];
        ClientsFirstName[j] = data[i][16];
        
        KclientRefund[j] = (BtotalCredit[j]/1.15)*(1-NZPRcommisionRate)-ClientsFee[j];
        KclientRefund[j] = KclientRefund[j].toFixed(2);
        var clientRefundInclusive = KclientRefund[j] * 1.15;
        clientRefundInclusive = clientRefundInclusive.toFixed(2);
        */
      }

    }
    //Browser.msgBox('temp', 'pause', Browser.Buttons.OK);
    //clearAgentDataSheet();
    
/*
    //newer email section of code ********************************************

    var body = "Hi "+agentsFirstName[j]+", <br><br><b>Remittance Advice</b><br> Kind regards,<br><br>Bernard Coogan<br><br>Director<br><br>NZ Petrol Refunds Limited<br><br>nzpetrolrefunds.co.nz<br><br>021 2066 719";
    var subject = agentsEmail[j];
    var emailTo = "nathanjeffreyyoung@gmail.com";
    
    // Create a new Spreadsheet and copy the current sheet into it.
    var newSpreadsheet = SpreadsheetApp.create("Spreadsheet to export");
    var projectname = SpreadsheetApp.getActiveSpreadsheet();
    
    if (agentsName[j] == "Simon Hanrahan") {//checks whether its Simon the Sales Manager in order to select the agent or sales manager template 
      salesTemplateSheet.copyTo(newSpreadsheet);// uses sales manager template
    } else {
      agentTemplateSheet.copyTo(newSpreadsheet);// uses agent template
    }
    
    // Find and delete the default "Sheet 1", after the copy to avoid triggering an apocalypse
    newSpreadsheet.getSheetByName('Sheet1').activate();
    newSpreadsheet.deleteActiveSheet();
    
    // Make zee PDF, currently called "pdf name.pdf"
    var pdf = DriveApp.getFileById(newSpreadsheet.getId()).getAs('application/pdf').getBytes();
    var attach = {fileName:'pdf name.pdf',content:pdf, mimeType:'application/pdf'};
    
    // Send the freshly constructed email 
    MailApp.sendEmail(emailTo, subject, body, {htmlBody: body, attachments:[attach]});
    
    // Delete the wasted sheet we created, so our Drive stays tidy.
    DriveApp.getFileById(newSpreadsheet.getId()).setTrashed(true);  
    //end of email section//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////.
    */
    //Browser.msgBox('temp', 'pause', Browser.Buttons.OK); ////////////////////////testing !! !! !! !! !! !!
    clearAgentDataSheet();
    
        //PDF CONVERSION AND EMAIL SECTION OF CODE///////////////////////////////////////////                                                        
    var date = Utilities.formatDate(new Date(), "GMT+12", "dd-MM-yyyy'T'HH:mm:ss'Z'");
    
    // Send the PDF of the spreadsheet to this email address
    //var email = "bernard@nzpetrolrefunds.co.nz"; 
    var email = "nzprauto@gmail.com"; 
    
    // Subject of email message
    //var subject = ClientsName[j] +" Invoice(s) " + date.toString();
    var subject = agentsEmail[j];
    var body;
    // Email Body can  be HTML too with your logo image - see ctrlq.org/html-mail
    //var body = ClientsName[j] +" Invoice(s) " + date.toString();
    //if (ClientsFee[j] > 0) {//checks whether a fee is present to determine what invoices need to be sent 
      body = "Hi "+agentsFirstName[j]+", \r\rPlease find attached your Remittance Advice.\r\rKind regards,\r\rBernard Coogan\r\rDirector\r\rNZ Petrol Refunds Limited\r\rnzpetrolrefunds.co.nz\r\r021 2066 719";
      
          
    //} else {
      //body = "Hi "+ClientsFirstName[j]+", \r\rWe have received your latest refund from the NZTA and will be loading that up for payment into your account tonight.\r\rYour refund came to $"+clientRefundInclusive+".\r\rPlease see attached payment notice and invoice.\r\rKind regards,\r\rBernard Coogan\r\rDirector\r\rNZ Petrol Refunds Limited\r\rnzpetrolrefunds.co.nz\r\r021 2066 719"
    //}
    
        
    var url = ss.getUrl();
    url = url.replace(/edit$/, '');

    /* Specify PDF export parameters
    // From: https://code.google.com/p/google-apps-script-issues/issues/detail?id=3579
    exportFormat = pdf / csv / xls / xlsx
    gridlines = true / false
    printtitle = true (1) / false (0)
    size = legal / letter/ A4
    fzr (repeat frozen rows) = true / false
    portrait = true (1) / false (0)
    fitw (fit to page width) = true (1) / false (0)
    add gid if to export a particular sheet - 0, 1, 2,..
    */

    var url_ext = 'export?exportFormat=pdf&format=pdf' // export as pdf / csv / xls / xlsx
      + '&size=letter' // paper size
      + '&portrait=true' // orientation, false for landscape
      + '&fitw=true&source=labnol' // fit to width, false for actual size
      + '&sheetnames=false&printtitle=false' // hide optional headers and footers
      + '&pagenumbers=false&gridlines=false' // hide page numbers and gridlines
      + '&fzr=false' // do not repeat row headers (frozen rows) on each page
      + '&gid='; // the sheet's Id

    var token = ScriptApp.getOAuthToken();
    var sheets = ss.getSheets();

    //make an empty array to hold your fetched blobs  
    var blobs = [];

    ///////////////////////////////////////////////////////////////
    if (agentsName[j] == "Simon Hanrahan") {//this if else block is redundant, but am relectant to change for fear of stuffing code(!)
    
      for (var i = 9; i < 10; i++) {//selecting sheet 9 to turn into pdf and email

        // Convert individual worksheets to PDF
        var response = cUseful.Utils.expBackoff(
          function() {
            return UrlFetchApp.fetch(url + url_ext + sheets[i].getSheetId(), {
              headers: {
                'Authorization': 'Bearer ' + token
              },
                muteHttpExceptions: true,
            });
          }, {
            logAttempts: true,
            lookahead: function(r) {
              return r.getResponseCode() === 429;
            }
          });

        //convert the response to a blob and store in our array
        //blobs[i] = response.getBlob().setName('Invoice ' + date.toString() + '.pdf');
        blobs[i] = response.getBlob().setName(sheets[i].getName() + '.pdf');
        
      }
      if (MailApp.getRemainingDailyQuota() > 0)
            GmailApp.sendEmail(email, subject, body, {
        attachments: [blobs[9].getAs(MimeType.PDF)],
        name: 'NZ Petrol Refunds'
      });
    }
    else {
      for (var i = 9; i < 10; i++) {//selecting sheets 9 to turn into pdf and email
        
        // Convert individual worksheets to PDF
        var response = cUseful.Utils.expBackoff(
          function() {
            return UrlFetchApp.fetch(url + url_ext + sheets[i].getSheetId(), {
                headers: {
                  'Authorization': 'Bearer ' + token
                },
                  muteHttpExceptions: true,
            });
          }, {
            logAttempts: true,
            lookahead: function(r) {
              return r.getResponseCode() === 429;
            }
          });
        
        //convert the response to a blob and store in our array
        //blobs[i] = response.getBlob().setName('Invoice ' + date.toString() + '.pdf');
        blobs[i] = response.getBlob().setName(sheets[i].getName() + '.pdf');
      }
      

      
      if (MailApp.getRemainingDailyQuota() > 0)
        GmailApp.sendEmail(email, subject, body, {
          attachments: [blobs[9].getAs(MimeType.PDF)],
          name: 'NZ Petrol Refunds'
        });
      
    }
   
    //END OF PDF AND EMAIL SECTION OF CODE/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  }
  Browser.msgBox('Done', 'The Remittance pdfs for each agent have been created (and draft emails within 5 mins).', Browser.Buttons.OK);
}
  
  
  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////    
function clearAgentDataSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var agentDataSheet = ss.getSheetByName("Agent_Data");
    
  agentDataSheet.getRange(2, 1, agentDataSheet.getLastRow(), agentDataSheet.getLastColumn()).clear();

}
 /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  function clearAgentRemittanceSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var AgentRemittanceSheet = ss.getSheetByName("Agent_Remittance");
    
  AgentRemittanceSheet.getRange(2, 1, AgentRemittanceSheet.getLastRow(), AgentRemittanceSheet.getLastColumn()).clear();

}
 /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////.
  
  //function to sort the New_Arrival sheet
  function sortNewArrivalSheet(){
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var newArrival = ss.getSheetByName("New_Arrival");
    
    var range = newArrival.getRange("B2:R1000");
    range.sort([{column: 2, ascending: true}, {column: 5, ascending: true}]);
    Browser.msgBox('Sort', 'List sorted (by client FED No. then Reference No.)', Browser.Buttons.OK);
    
  }
  
  //function to move selected lines from New_Arrival sheet to Inbox_Sheet
  function moveNewArrivalsToInbox(){
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var newArrivalSheet = ss.getSheetByName("New_Arrival");
    var inboxSheet = ss.getSheetByName("Inbox_Sheet");
  
    var newArrivalData = newArrivalSheet.getDataRange().getValues();
    var numberOfNewArrivalRows = newArrivalSheet.getLastRow();  
  
    for (var i = 1; i < numberOfNewArrivalRows; i++) { 
      if (newArrivalData[i][0] != ""){//checks if the row is marked/checked/approved
        
        inboxSheet.appendRow([newArrivalData[i][1],                      //sends the line to Inbox_Sheet  
                              newArrivalData[i][2],
                              newArrivalData[i][3],
                              newArrivalData[i][4],
                              newArrivalData[i][5],
                              newArrivalData[i][6],
                              newArrivalData[i][7],
                              newArrivalData[i][8],
                              newArrivalData[i][9],
                              newArrivalData[i][10],
                              newArrivalData[i][11],
                              newArrivalData[i][12],
                              newArrivalData[i][13],
                              "",
                              "",
                              newArrivalData[i][16],
                              newArrivalData[i][17],
                              newArrivalData[i][18]
                             ]);
        
        //remove copied line from New_Arrival sheet
        clearNewArrivalSheet(); 
        
      }
    }
  }


  function clearNewArrivalSheet() {
    
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("New_Arrival");

    var rows = sheet.getDataRange();
    var numRows = rows.getNumRows();
    var values = rows.getValues();
    
    var rowsDeleted = 0;
    for (var i = 1; i <= numRows - 1; i++) {//i=1 so row 0 (the headers) are not deleted
      var row = values[i];
      if (row[0] != '') {//checks to make sure only rows with something in the first column are selected
        sheet.deleteRow((parseInt(i)+1) - rowsDeleted);
        rowsDeleted++;
      }
    }
  }
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  //add 30 y's to the checkbox column
  
  function addChecks(){
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("New_Arrival");
    
    var rows = sheet.getDataRange();
    var numRows = rows.getNumRows();
    var values = rows.getValues();
    
    for (var i = 1; i <= 30; i++) {
      var row = values[i];
      if (row[0] != '') {
        Browser.msgBox(i, Browser.Buttons.OK);
        //row[0] = "y";
      }  
    }
  }
  