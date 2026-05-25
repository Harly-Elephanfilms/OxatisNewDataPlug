GENERAL
B. PRODUCTS
C. PRODUCT WEBBLOCK
D. PRODUCT CHARACTERISTICS
E. PRODUCT BUNDLES
F. PRODUCT ATTRIBUTES
G. PRODUCT PACKAGING
H. PRODUCT CATEGORIES
I. DISCOUNT RULES
J. CUSTOMERS
K. IMAGES
L. SALES ORDERS
M. QUOTATIONS
N. SALES REPRESENTATIVE
O. SHIPPING TYPE
P. SALES ORDER PROGRESS STATE
Q. TAX RATES
R. OPTION TYPES
S. OPTION VALUES
T. PAYMENT TYPE
U. C# Web Service Call Sample
V. PHP Web Service Call Sample
OWS API User Guide
Version 11.30 26 June 2022
 Page 1 / 57
 A.GENERAL
OWS API User Guide
Version 11.30 26 June 2022
With the OXATIS API, you can manage Customers, Products, Discount Rules, Images and Sales Orders through a collection of a web services API.
A1) AppID
Under the ISV contract, Oxatis provides you with a unique ID, called an AppID, which must be used in all your Web Service calls. Please contact our development department for more information.
A2) Token
You must obtain a valid token before using Oxatis Web Services. To do this:
• Go to the administration console.
• Choose “Access rights management” under the “Account/Profiles” menu.
• Select or add a new user. Check “Use Web Services” your changes.
• Go back into this user’s profile to retrieve the token generated for Web Services access.
A3) Access Rights
Web Services are linked to the access rights defined in the Oxatis administration console.
This way, the Web Services call is subject to the access rights defined for each user admin account. These access rights will be automatically applied in the Web Services toolkit.
Example: If only the “Use of Web Services” box is ticked, the user will not be able to make Web Services calls and will receive a 503 error: Unauthorized.
  Page 2 / 57

 OWS API User Guide
If you want to allow the user to create, modify or delete products using Web Services, you must also tick the following boxes in the “CATALOGUE / Products” section: Access, Edit, Insert and Delete.
Version 11.30 26 June 2022
  Page 3 / 57

 A4) URL Services
OWS API User Guide
Version 11.30 26 June 2022
For most calls to Oxatis Web Services API you should use the following URLs:
• Customer Services:
https://webservices.oxatis.com/webservices/httpservices/UserServices.aspx
• Discount rules Services: https://webservices.oxatis.com/webservices/httpservices/DiscountRuleServices.aspx
• Product Services: https://webservices.oxatis.com/webservices/httpservices/ProductServices.aspx
• Product Attributes Services: https://webservices.oxatis.com/webservices/httpservices/ProductAttributesServices.aspx
• Product Bundles Services: https://webservices.oxatis.com/webservices/httpservices/ProductBundleServices.aspx
• Product Category Services: https://webservices.oxatis.com/webservices/httpservices/CategoryServices.aspx
• Product Characteristics Services: https://webservices.oxatis.com/webservices/httpservices/ProductCharacteris ticsServices. aspx
• Product Packaging Services: https://webservices.oxatis.com/webservices/httpservices/ProductPackagingServices.aspx
• Product WebBlock Services: https://webservices.oxatis.com/webservices/httpservices/ProductWebBlockServices.aspx
• Image Gallery Services: https://webservices.oxatis.com/webservices/httpservices/ImageGalleryServices.aspx
• Option Types Services: https://webservices.oxatis.com/webservices/httpservices/OptionTypesServices.aspx
• Option Values Services: https://webservices.oxatis.com/webservices/httpservices/OptionValuesServices.aspx
• Sales Order Services: https://webservices.oxatis.com/webservices/httpservices/OrderServices.aspx
• Sales Order Progress Log Services: https://webservices.oxatis.com/webservices/httpservices/ProgressStateLogServices. aspx
• Sales Order Progress State Services: https://webservices.oxatis.com/webservices/httpservices/ProgressStateServices. aspx
• Payment Type Services: https://webservices.oxatis.com/webservices/httpservices/PaymentTypeServices.aspx
• Quotation Services: https://webservices.oxatis.com/webservices/httpservices/QuotationServices.aspx
• Sales Representative Services: https://webservices.oxatis.com/webservices/httpservices/SalesRepServices. aspx
• Shipping Type Services: https://webservices.oxatis.com/webservices/httpservices/ShippingTypeServi ces.as px
• Tax Rate Services: https://webservices.oxatis.com/webservices/httpservices/TaxRateServices. aspx
Note: Oxatis Web Services requires TLS 1.2 on all connections.
A5) REST Interface
The API uses a REST-like interface. This means that our OXATIS method calls are made over the internet by sending HTTP GET or POST requests to the OXATIS server. Nearly any computer language can be used to communicate over HTTP with the REST server.
                     Page 4 / 57

 OWS API User Guide
Note: If you manually form your HTTP POST requests to OXATIS, you must include the request data in the POST body. In addition, you must include a Content-Type: header of application/x-www-form- urlencoded.
A6) Building a Web Page Form
➢ Form Attributes
Forms begin with the <form> tag and end with the </form> tag. The <form> tag must contain the two following mandatory attributes:
- Action:
This <form> tag attribute specifies where the information will be sent. action="https://webservices.oxatis.com/webservices/httpservices/ProductServices.aspx"
- Method:
This <form> tag attribute specifies how the information will be sent to the destination location. The method attribute can be defined as:
method="POST"
or method="GET"
With Oxatis Web Services, form data to be submitted is sent using the POST method.
method="POST" is the most common method used to send data from a form to information processing software. The POST method can send much more information than the typical GET method. However, certain browsers may limit the amount of POST information to 32k. With the POST method, data is not sent via the URL, as is the case with the GET method. Instead, it is sent as content invisible to the form user.
- EncType:
The final <form> tag attribute specifies how form data will be encoded before it is sent. The default enctype attribute is:
enctype="application/x-www-form-urlencoded"
➢ <Input>tags
You must specify the three required fields:
- The first is used to define the AppId <input id="AppId" name="AppId" type="hidden value="..."/>
- The second is used to define the token <input id="Token" name="Token" type="hidden value="..."/>
- The second is used to define the API method name for the web services call: <input id="Method" name="Method" type="hidden" value="..."/>
➢ <TextArea>tag
This tag is required to submit the XML data in your form:
<textarea id="Data" name="Data" value="..."/>
The optional attributes "cols" and "rows" specify how many characters wide and how many lines deep to make the text area input field. If these attributes are not specified, individual browsers will use their own default sizes.
Here is an example of a Web Service call to the “ProductGet” method:
Version 11.30 26 June 2022
    <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1 -transitional.dtd"> <html xmlns="http://www.w3.org/1999/xhtml">
<head>
</head>
<body>
<form method="post" action="https://webservices.oxatis.com/webservices/httpservices/productservices.aspx"enctype="application/x-www-form-urlencoded"> <input id="Send" type="submit" value="Post" />
<br/>
<input id="Method" name="Method" type="hidden" value="ProductGet"/>
<input id="Token" name="Token" type="hidden" value="...................."/>
<input id="AppId" name="AppId" type="hidden" value="...................."/>
<textarea id="Data" name="Data" cols="128" rows="40">
<?xml version="1.0" encoding="utf-8"?>
<Product xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">
<OxID>0</OxID>
<ItemSKU> </ItemSKU> </Product>
</textarea>
                    Page 5 / 57

 A7) OxID
</form> </body> </html>
OWS API User Guide
Version 11.30 26 June 2022
    OxID is an identifier that represents a unique record in OXATIS data tables. If supplied, OxID is always given priority over all record identification.
A8) XML Response
Each method call to the API returns a DataResultService response which contains: ✓ The status code return
Table of error codes that can be returned:
300 Warnings encountered. 503 Unauthorized.
600 Web services maintenance.
Note for Error 503:
4 possible reasons this error occurs:
• TheURLofthepagedoesn’texist.
• TheuserhasnotbeengrantedaccessrightsforWebServices. • TheAppIdisnotvalid.
• Unauthorizedaccesstoacustomersite.
✓ The status subcode return
Table of error subcodes that can be returned:
1002 Invalid data.
1004 Duplicate data.
✓ The detailed error messages.
✓ The returned data.
❖ This is an example of an XML return from “ProductAdd” method call:
If the method call to the API is successful, you will obtain an OxID greater than 0 and a StatusCode value of 200. Otherwise, you will obtain a negative value of OxID -1 and you can check the ErrorDetails for further information.
   Status Code Description
  200
   No errors encountered.
   500
   Errors occurred. For further details, inspect the ErrorDetails from the XML response.
   504
   The daily limit of Web Services calls has been reached.
       Status Sub Code Description
  1001
   Record not found.
   1003
   Duplicate id.
     <DataResultService> <StatusCode>200</StatusCode> <StatusSubCode>0</StatusSubCode > <ErrorDetails />
<Data>
<OxID>76763</OxID> </Data>
</ DataResultService>
        Page 6 / 57

 OWS API User Guide
❖ Another example of an XML return from “ProductGet” method call:
If the method call to the API is successful, you will obtain a Product XML Data structure and a StatusCode value of 200. Otherwise no data will be returned and you can check the ErrorDetails for further information.
A9) Notes
❖ All XML structure description tags below are case sensitive. Therefore, for each Product, Customer
or Image XML structure, you must respect upper / lower case tags.
❖ XML strings must be encoded to avoid problems with accented and other special characters.
Version 11.30 26 June 2022
  <DataResultService> <StatusCode>200</StatusCode> <StatusSubCode>200</ StatusSubCode> <ErrorDetails />
<Data>
<Product>
<OxID>76762</OxID> <ItemSKU>PC</ItemSKU> <Name>Personal computer<Name>
</Product> </Data>
</DataResultService>
             Page 7 / 57

                                              B.PRODUCTS
B1) Product
➢ XML Structure
OWS API User Guide
Version 11.30 26 June 2022
   <Product>
<OxID />
<ItemSKU /> <ProductLanguage /> <OptionValues1>
<OxID /> <Code /> <Name />
</OptionValues1>
<OptionValues2 /> similar to<OptionValues1> <OptionValues3 /> similar to <OptionValues1> <OptionTypes1>
<OxID />
<Name />
</OptionTypes1>
<OptionTypes2 /> similar to <OptionTypes1> <OptionTypes3 /> similar to <OptionTypes1> <ParentItemID />
<ParentItemSKU />
<ProductType />
<Name />
<Description />
<Price>
<Value />
<VATIncluded />
</Price>
<Price1 /> similar to<Price> <Price2 /> similar to<Price> <Price3 /> similar to<Price> <Price4 /> similar to <Price> <Price5 /> similar to<Price> <Price6 /> similar to<Price> <Price7 /> similar to<Price> <Price8 /> similar to<Price> <Price9 /> similar to<Price> <TaxRate />
<EcoTaxTI /> <LongDescription />
< BigImgFileNa me /> <SmallImgFileN ame /> <Category1>
<OxID />
<Name /> </Category1> <Category2>
<OxID />
                                              <Name />
<Category2
<Category3
<Category4
<Category5
<Category6
<Category7
<Category8
<Category9
<Category10 /> similar to <Category1> <Brand>
 /> similar to <Category1> /> similar to <Category1> /> similar to <Category1> /> similar to <Category1> /> similar to <Category1> /> similar to <Category1> /> similar to <Category1> /> similar to <Category1>
          <OxID />
<Name /> </Brand> <QuantityInStock>
<Value />
<Append /> </QuantityInStock> <QuantityReorder /> <ShowInStockNote /> <ShowStockLevel /> <DaysToShip> /> <ShowIfOutOfStock /> <SaleIfOutOfStock /> <SaleIfOutOfStockScen ario /> <ShowDaysToship />
<Weight />
<DimensionHeight /> <DimensionWidth /> <DimensionLength /> <HandlingSurcharge1 ST /> <HandlingSurchargeOth ers /> <ShipPrice />
<DiscountGridCode />
<MetaTitle />
<MetaDescription /> <MetaKeywords> </MetaKeywords> <LastUpdateDate />
<LinkedItemID />
<LinkedItemSKU /> <LinkedItemLangu age /> <LinkedUpdating /> <OptionIsDefault />
<EANCode />
<ItemCondition />
<Guarantee />
<UnitesForSale />
<UnitesForSale1 />
<UnitesForSale2 />
<UnitesForSale3 />
       similar to <QuantityInStock>
                                <UnitesForSale4 /> <UnitesForSale5 /> <UnitesForSale6 /> <UnitesForSale7 /> <UnitesForSale8 /> <UnitesForSale9 /> <Cost />
< ItemType /> <Visible /> <Position />
<MPN /> <StrikethroughPrice>
<Value />
<VATIncluded /> </StrikethroughPrice> <StrikethroughPrice1 <StrikethroughPrice2 <StrikethroughPrice3 <StrikethroughPrice4 <StrikethroughPrice5 <StrikethroughPrice6 <StrikethroughPrice7 <StrikethroughPrice8 <StrikethroughPrice9 <CanonicalURLCustomizedContent /> < TaxCountryISOCode /> <ReviewRating />
/> similar to <StrikethroughPrice> /> similar to <StrikethroughPrice> /> similar to <StrikethroughPrice> /> similar to <StrikethroughPrice> /> similar to <StrikethroughPrice> /> similar to <StrikethroughPrice> /> similar to <StrikethroughPrice> /> similar to <StrikethroughPrice> /> similar to <StrikethroughPrice>
<ImageList> <ThumbnailImgFileN ame /> <ImgFileName /> <ZoomImgFileName />
</ImageList> </ImagesList>
</Product>
<ReviewCount />
< FamilyName />
< UrlExternalLink /> <Comment />
< DateOfAvailability /> < HighlightType /> <State />
< CreationDate /> <HasAttributes />
< DynamicImages /> <ImagesList>
 Page 8 / 57

                                                                                                                     OWS API User Guide
➢ Field Definitions, Types and Values
Version 11.30 26 June 2022
           Field
<OxId />
<ItemSKU />
<Name /> <ProductLanguage />
<OptionValues2 /> <OptionValues3 /> <OptionTypes1>
<OxID />
<Name /> </OptionTypes1> <OptionTypes2 /> <OptionTypes3 />
< ParentItemSKU />
<Description />
<TaxRate /> <EcoTaxTI /> <LongDescription />
<SmallImgFileName />
<Category2 /> <Category3 /> <Category4 /> <Category5 /> <Category6 /> <Category7 /> <Category8 /> <Category9 /> <Category10 />
<QuantityInStock> <Value /> <Append />
</QuantityInStock> <QuantityReorder />
< ShowI nStockN ote /> <ShowStockLevel /> <DaysToShip /> <ShowIfOutOfStock /> <SaleIfOutOfStock />
<ShowDaysToship /> <Weight /> <DimensionHeight /> <DimensionWidth /> <DimensionLength />
< Ha ndling Sur cha r g e 1 ST /> < Ha ndling Sur cha r g e Othe r s <ShipPrice /> <DiscountGridCode />
<MetaDescription />
<Price1 /> <Price2 /> <Price3 /> <Price4 /> <Price5 /> <Price6 /> <Price7 />
Type
integer string string string
integer string
string
string
float float string
string
Length Description
Unique ID stored in OXATIS Product table. 40 Product code.
200 Product name.
2 Product language code.
similar to <OptionValues1>. similar to <OptionValues1>.
Unique option types ID stored in OXATIS Option
Types table.
50 Option Type name.
similar to <OptionTypes1>. similar to <OptionTypes1>.
40 Parent item code.
4kb Product description.
VAT Rate.
Ecotax VAT included.
16kb Detailed product description.
100 Thumbnail file name.
similar to <Category1>. similar to <Category1>. similar to <Category1>. similar to <Category1>. similar to <Category1>. similar to <Category1>. similar to <Category1>. similar to <Category1>. similar to <Category1>.
Current quantity in stock.
Add a value to existing quantity.
Reorder Threshold. similar to <QuantityInStock> Display the fact that an item is in stock.
Display stock level.
Days to ship.
Show this item even if unavailable.
Propose this item for sale even if unavailable.
Display the number of days to ship. Product weight.
Product height.
Product width.
Product length.
Cost of handling (excl. VAT) of 1st unit.
Cost of handling (excl. VAT) for further units. Shipping charges.
6 Discount Grid code. 200 Meta description
(SEO Properties).
similar to <Price> similar to <Price> similar to <Price> similar to <Price> similar to <Price> similar to <Price> similar to <Price>
Instruction
Must be greater than zero.
                              ISO- 639-1 Code Supported language values:
fr French, en English, es Spanish, de German, it Italian, nl Dutch, ca Catalan, pt Portuguese.
Must be greater than zero.
   < OptionValues1 > <OxID />
<Code />
<Name />
< /OptionValues1 >
        integer
string string
   10 70
     Unique option value ID stored in OXATIS Option Values table.
Option Value code.
Option Value name.
        Must be greater than zero.
                                  < ParentItemID />
   integer
      Unique parent Item ID stored in OXATIS Product table.
   Must be greater than zero.
   <ProductType />
   integer
      Product type.
   Values:
0 Normal
100 Parent item
110 Item with options 200 Bundle
   <Price> <Value />
<VATIncluded /> </Price>
   float boolean
      Price 1 value.
With VAT included
   Must be greater than or equal zero.
false default value
           Must be greater than or equal zero.
The file name must exist in the “Image Gallery” otherwise it will not be attached to the product.
       <BigImgFileName />
   string
   100
   Main Image file name.
   The file name must exist in the “Image Gallery” otherwise it will not be attached to the product.
    <Category1> <OxID />
<ParentOxId />
<Name /> </Category1>
    integer integer string
     100
    Unique category ID stored in OXATIS Category table.
Parent category ID stored in OXATIS Category table.
Category name.
    Must be greater than zero.
Must be greater than or equal zero.
                                                               <Brand> <OxID />
<Name /> </Brand >
   string
   50
   Unique category ID stored in OXATIS Brand table. Brand name.
   Must be greater than zero.
                                                <SaleIfOutOfStock Scen ario />
   integer
      Unavailability scenario.
   Accepted values:
0 None, display nothing
1 Reason #1 (By default "Out of Stock")
2 Reason #2 (By default "Available at Supplier") 3 Reason #3 (By default "Item Discontinued")
                                              />
Integer boolean
boolean boolean integer boolean boolean
boolean integer integer integer integer float float float string
string
false default value false default value
false default value
Must be greater than or equal zero. false default value
false default value
false default value
Must be greater than or equal zero. Must be greater than or equal zero. Must be greater than or equal zero. Must be greater than or equal zero.
Must be greater than or equal zero.
                 <MetaTitle />
   string
   100
   Meta title
(SEO Properties).
      <MetaKeywords />
   string
   200
   Meta keywords (SEO Properties).
                                                       Page 9 / 57

                                                                                                            OWS API User Guide
Version 11.30 26 June 2022
     Field
<Price8 /> <Price9 />
< DiscountRule I d1 />
< DiscountRule I d2 />
< DiscountRule I d3 />
< DiscountRule I d4 />
< DiscountRule I d5 />
< DiscountRule I d6 />
< DiscountRule I d7 />
< DiscountRule I d8 />
< DiscountRule I d9 />
<LastUpdateDate />
< A dditionalImag esWidth />
< A dditionalImag esHeig ht /> <AdditionalImagesThumbnailWidth /> <AdditionalImagesZoomWidth /> <AdditionalImagesZoomPositio n />
<AdditionalImagesZoomHeight /> <AdditionalImagesThumbnailCha ngeMode
<LinkedItemSKU />
<LinkedUpdating />
<OptionIsDefault /> <EANCode />
<Guarantee /> <UnitsForSale /> <UnitsForSale1 /> <UnitsForSale2 /> <UnitsForSale3 /> <UnitsForSale4 /> <UnitsForSale5 /> <UnitsForSale6 /> <UnitsForSale7 /> <UnitsForSale8 /> <UnitsForSale9 /> <Cost /> <ItemType />
<Visible /> <MPN />
< Str ike thr oug hPr ice 1 /> < Str ike thr oug hPr ice 2 /> < Str ike thr oug hPr ice 3 /> < Str ike thr oug hPr ice 4 /> < Str ike thr oug hPr ice 5 /> < Str ike thr oug hPr ice 6 /> < Str ike thr oug hPr ice 7 /> < Str ike thr oug hPr ice 8 /> < Str ike thr oug hPr ice 9 />
<TaxCountryISOCode /> <ReviewRating /> <ReviewCount /> <FamilyName /> <UrlExternalLink /> <Comment />
< D a te Of A v a ila b ility />
<State /> <CreationDate /> <HasAttributes /> <DynamicImages />
Type Length
date integer integer integer integer integer
integer integer
String 40
boolean
boolean
string 48
integer integer
float integer
boolean
string 32
string 2 float
int
string 100 string 225 string 50 datetime
integer datetime boolean boolean
Description
similar to <Price> similar to <Price>
similar to <DiscountRuleId>. similar to <DiscountRuleId>. similar to <DiscountRuleId>. similar to <DiscountRuleId>. similar to <DiscountRuleId>. similar to <DiscountRuleId>. similar to <DiscountRuleId>. similar to <DiscountRuleId>. similar to <DiscountRuleId>. Date of last update.
Main image width in pixels. Main image height in pixels. Thumbnail image width in pixels Zoom image width in pixels. Zoom image position.
Zoom image width in pixels. Image replacement.
Linked product code.
Linked modification (for multi-lingual sites).
Default option for the item. EAN code.
Guarantee period in months. Packing unit.
similar to <UnitsForSale> similar to <UnitsForSale> similar to <UnitsForSale> similar to <UnitsForSale> similar to <UnitsForSale> similar to <UnitsForSale> similar to <UnitsForSale> similar to <UnitsForSale> similar to <UnitsForSale>
Cost (Excl. VAT) Item type.
Item published. Manufacturer Part Number.
similar to <StrikethroughPrice>. similar to <StrikethroughPrice>. similar to <StrikethroughPrice>. similar to <StrikethroughPrice>. similar to <StrikethroughPrice>. similar to <StrikethroughPrice>. similar to <StrikethroughPrice>. similar to <StrikethroughPrice>. similar to <StrikethroughPrice>.
Item review rate.
Item review count.
Family name (reserved for ERP). URL rewriting.
Comment.
Date of availability
Element visibility and work progress
Item date of creation.
If product has any text or multiple attributes Product images will be processed dynamically.
Instruction
                       < DiscountRule I d> <OxID />
<Name /> </DiscountRuleId>
       integer
   100
     Unique discount rule ID stored in OXATIS Discount Rule table.
Discount Rule name.
       Must be greater than zero.
                                                                                                                          />
Value between 0 and 999. Value between 0 and 999. Value between 0 and 999. Value between 0 and 999. Accepted values:
2 To the right of the main item image. 4 To the left of the main item image. 5 Replace the main item image
Value between 0 and 999.
Accepted values:
0 Click on thumbnail (manual mode)
1 Hover on thumbnail (automatic mode)
  <LinkedItemID />
   integer
      Unique linked item ID stored in OXATIS Product table.
   Must be greater than zero.
Note: This is useful for duplicating items through the web service: ProductDuplicate.
 Note: This is useful for duplicating items through the web service: ProductDuplicate.
false default value.
Note: This is useful for duplicating items through the web service: ProductDuplicate.
false default value
Value between 0 and 256.
Must be greater than or equal one.
Must be greater than or equal zero. Accepted values:
0 Undefined
1 Tangible Item
2 Untangible Item
  <LinkedItemLanguage />
   string
   2
   Linked item language code.
   ISO- 639-1 Code Supported language values:
fr French, en English, es Spanish, de German, it Italian, nl Dutch, ca Catalan, pt Portuguese.
Note: This is useful for duplicating items through the web service: ProductDuplicate.
                  <ItemCondition />
   integer
      Condition of the item.
   Accepted values:
0 Undefined, 1 New, 2 Used, 3 Refurbished
                                                                                                            < Str ike thr oug hPr ice > <Value />
<VATIncluded /> < /Str ike thr oug hPr ice >
   float boolean
      Strikethrough Price 1 value. With VAT included.
   Must be greater than or equal zero.
false default value
                                                               <CanonicalURLCustom izedCo nte nt />
   string
   100
   Configurable part of the canonical URL.
   All spaces and specials characters will be automatically transformed during theupload.
 i.e: FR France, IT Italy, GB Great Britain, ES Spain...
Value between 01/01/1901 and 31/12/2078.
visibility
Default value: null or false.
                                               <HighlightType />
   integer
      Item highlight.
   Accepted values:
1 First place
2 Second place 3 Third place
                            <ImagesList> <ImageList>
< T hum bna ilI m g File N a m e /> <ImgFileName /> <ZoomImgFileName />
</ImageList> </ImagesList>
   string string string
    100 100 100
   Additional images for a single product.
Thumbnail image. Main image. Zoom image.
   Images file name must exist in the “Image Gallery” otherwise it will not be attached to the product.
  Page 10 / 57

                                                                                           B2) Product List
➢ XML Structure
<ProductList> <PageInformation>
<PageNumber /> <PageSize /> <TotalItems /> <TotalPages />
</PageInformation> <LatestModifiedDateSt art /> <LatestModifiedDateEnd /> <Visible />
<Category1> <OxID /> <Name />
</Category1>
<Category2 /> similar to <Category1> <Category3 /> similar to <Category1> <Category4 /> similar to <Category1> <Category5 /> similar to <Category1> <Category7 /> similar to <Category1> <Category8 /> similar to <Category1> <Category9 /> similar to <Category1> <Category10 /> similar to <Category1> <ProductsID />
<ProductID> <OxID />
<ItemSKU /> <OptionTypes1>
<OxID />
</OptionTypes1>
<OptionTypes2 /> similar to <OptionTypes1> <OptionTypes3 /> similar to < OptionTypes1> <OptionValues1>
<OxID />
</OptionValues1>
<OptionValues2 /> similar to <OptionValues1> <OptionValues3 /> similar to <OptionValues1>
</ProductID> <ProductsID />
</ProductList>
OWS API User Guide
Version 11.30 26 June 2022
 ➢ Field Definitions, Types and Values
      Field
<LatestModifiedDateStart />
<Visible />
<Category2 />
<Category4 /> <Category6 /> <Category8 /> <Category10 />
Type
datetime
boolean
Length
Description
Start date must be indicated. This corresponds to the last item record’s last modified date.
Filter on published or hidden items.
similar to <Category1>.
similar to <Category1>. similar to <Category1>. similar to <Category1>. similar to <Category1>.
Instruction
Must be greater than January 1, 2000.
true Published Items false Hidden items null All items
        <PageInformation> <PageNumber /> <PageSize /> <TotalItems /> <TotalPages />
</PageInformation>
         integer integer integer integer
           The page number to request.
The page size to request.
Total items retrieved in OXATIS Product table.
Total pages are calculated according to the total items and the page size.
        Must be greater than zero. Must be greater than zero.
       < L atestM odifiedDateEnd />
    datetime
       End date must be indicated. This corresponds to the last item record’s last modified date.
     Must be greater than January 1, 2000.
    <Category1> <OxID />
<ParentOxId /> <Name />
</Category1>
         integer integer string
          Unique category ID stored in OXATIS Category table. Parent category ID stored in OXATIS Category table. Category name.
       Must be greater than zero.
Must be greater than or equal zero.
     <Category3 />
         similar to <Category1>.
      <Category5 />
         similar to <Category1>.
      <Category7 />
         similar to <Category1>.
      <Category9 />
         similar to <Category1>.
       <ProductsID /> <ProductID> <OxID />
<ItemSKU /> <OptionTypes1>
<OxID /> </OptionTypes1> <OptionTypes2/> <OptionTypes3 /> < OptionValues1 > <OxID />
< /OptionValues1 > <OptionValues2 /> <OptionValues3 />
</ProductID> <ProductsID />
    integer string
    40
   Unique product ID stored in OXATIS Product table. Product Code.
Unique option type ID stored in OXATIS Option Types table.
similar to <OptionTypes1> similar to <OptionTypes1>
Unique option value ID stored in OXATIS Option Values table.
similar to <OptionValues1>
similar to <OptionValues1>
       Page 11 / 57

                              B3)
Related Product
➢ XML Structure
<RelatedProductsEntity> <Item>
<OxID />
<ItemSKU /> <ProductLanguage /> <ProductType /> <ParentItemSKU /> <ParentItemID /> <OptionValues1>
<OxID /> <Code /> <Name />
</OptionValues1>
<OptionValues2 /> similar to <OptionValues1> <OptionValues3 /> similar to <OptionValues1> <OptionTypes1>
<OxID / >
<Name />
</OptionTypes1>
<OptionTypes2 /> similar to <OptionTypes1> <OptionTypes3 /> similar to <OptionTypes1>
</Item>
<RelatedItem /> similar to <Item> <Position />
</RelatedProductsEntity>
OWS API User Guide
Version 11.30 26 June 2022
 ➢ Field Definitions, Types and Values
Field       Type Length Description Instruction
            <Item> <OxID />
<ItemSKU /> <ProductLanguage /> <ProductType /> <ParentItemSKU /> <ParentItemID /> <OptionTypes1>
<OxID / >
<Name /> </OptionTypes1> <OptionTypes2 /> <OptionTypes3 /> < OptionValues1 >
<OxID /> <Code /> <Name />
< /OptionValues1 > <OptionValues2 /> <OptionValues3 />
</Item>
                         integer string string integer string integer
integer string
integer string string
   40 40
10 70
     Unique product ID stored in OXATIS Product table. Product Code.
Product Language code.
Product Type.
Parent Item Code.
Unique Parent Item ID stored in OXATIS Product table.
Unique option type ID stored in OXATIS Option Types table. Option type name.
similar to <OptionTypes1> similar to <OptionTypes1>
Unique option value ID stored in OXATIS Option Values table. Option value code.
Option value name.
similar to <OptionValues1> similar to <OptionValues1>
                           ISO- 639-1 Code Supported language values: fr, en, es, de, it, nl, ca, pt.
Values: 0 Normal, 100 Parent, 110 WithOptions, 200 Bundle.
    <RelatedItem> <OxID />
<ItemSKU /> <ProductLanguage /> <ProductType /> <ParentItemSKU /> <ParentItemID /> <OptionTypes1>
<OxID / >
<Name /> </OptionTypes1> <OptionTypes2 /> <OptionTypes3 /> < OptionValues1 >
<OxID /> <Code /> <Name />
< /OptionValues1 > <OptionValues2 /> <OptionValues3 />
</RelatedItem>
  integer string string integer string integer
integer string
integer string string
 40 40
10 70
 Unique product ID stored in OXATIS Product table. Product Code.
Product Language code.
Product Type.
Parent Item Code.
Unique Parent Item ID stored in OXATIS Product table.
Unique option type ID stored in OXATIS Option Types table. Option type name.
similar to <OptionTypes1> similar to <OptionTypes1>
Unique option value ID stored in OXATIS Option Values table. Option value code.
Option value name.
similar to <OptionValues1> similar to <OptionValues1>
 ISO- 639-1 Code Supported language values: fr, en, es, de, it, nl, ca, pt.
Values: 0 Normal, 100 Parent, 110 WithOptions, 200 Bundle.
  <Position />
   integer
    Related product position.
    Must be greater than or equal zero.
   Page 12 / 57

                                         B4) Linked Product ➢ XML Structure
<LinkedProduct> <Item>
<OxID />
<ItemSKU /> <ProductLanguage /> <ProductType /> <ParentItemSKU /> <ParentItemID /> <OptionValues1>
<OxID /> <Code /> <Name />
</OptionValues1>
<OptionValues2 /> similar to <OptionValues1> <OptionValues3 /> similar to <OptionValues1> <OptionTypes1>
<OxID / >
<Name />
</OptionTypes1>
<OptionTypes2 /> similar to <OptionTypes1> <OptionTypes3 /> similar to <OptionTypes1>
</Item>
<LinkedItem /> similar to <Item> <Quantity />
<Fixed />
<Compulsory />
<Deletable />
<Offered />
<Position />
</LinkedProduct>
OWS API User Guide
Version 11.30 26 June 2022
 ➢ Field Definitions, Types and Values
      Field
Type
Length
Description
Instruction
         <Item> <OxID />
<ItemSKU /> <ProductLanguage /> <ProductType /> <ParentItemSKU /> <ParentItemID /> <OptionTypes1>
<OxID / >
<Name /> </OptionTypes1> <OptionTypes2 /> <OptionTypes3 /> < OptionValues1 >
<OxID /> <Code /> <Name />
< /OptionValues1 > <OptionValues2 /> <OptionValues3 />
</Item>
                         integer string string integer string integer
integer string
integer string string
    40 2
40
50
10 70
     Unique product ID stored in OXATIS Product table. Product Code.
Product Language code.
Product Type.
Parent Item Code.
Unique Parent Item ID stored in OXATIS Product table.
Unique option type ID stored in OXATIS Option Types table. Option type name.
similar to <OptionTypes1> similar to <OptionTypes1>
Unique option value ID stored in OXATIS Option Values table. Option value code.
Option value name.
similar to <OptionValues1> similar to <OptionValues1>
                          ISO- 639-1 Code Supported language values: fr, en, es, de, it, nl, ca, pt. Values: 0 Normal, 100 Parent, 110 WithOptions, 200 Bundle.
   <LinkedItem> <OxID />
<ItemSKU /> <ProductLanguage /> <ProductType /> <ParentItemSKU /> <ParentItemID /> <OptionTypes1>
<OxID / >
<Name /> </OptionTypes1> <OptionTypes2 /> <OptionTypes3 /> < OptionValues1 >
<OxID /> <Code /> <Name />
< /OptionValues1 > <OptionValues2 /> <OptionValues3 />
</LinkedItem>
  integer string string integer string integer
integer string
integer string string
 40 2
40
50
10 70
 Unique product ID stored in OXATIS Product table. Product Code.
Product Language code.
Product Type.
Parent Item Code.
Unique Parent Item ID stored in OXATIS Product table.
Unique option type ID stored in OXATIS Option Types table. Option type name.
similar to <OptionTypes1> similar to <OptionTypes1>
Unique option value ID stored in OXATIS Option Values table. Option value code.
Option value name.
similar to <OptionValues1> similar to <OptionValues1>
 ISO- 639-1 Code Supported language values: fr, en, es, de, it, nl, ca, pt. Values: 0 Normal, 100 Parent, 110 WithOptions, 200 Bundle.
  <Quantity />
   integer
    Linked item quantity.       Must be greater than zero and less than 32768.
   <Fixed /> <Deletable /> <Position />
boolean boolean integer
Linked item quantity can’t be modified in the shopping cart. Linked item can be deleted in the shopping cart.
Linked item position.
Must be greater than or equal zero.
  <Compulsory />
   boolean
       Linked item is compulsory.
    <Offered />
   boolean
       Linked item can be offered in the shopping cart.
        Page 13 / 57

                                              OWS API User Guide
B5) Product Additional Images ➢ XML Structure
<ProductImageList> <OxID /> <ImageList>
<Image> <OxID />
< ThumbnailImgFile Na m e /> <ImgFileName /> <ZoomImgFileName /> <ThumbnailImgUrl /> <ImgUrl />
<ZoomImgUrl />
<Position /> </Image>
</ImageList> </ProductImageList>
➢ Field Definitions, Types and Values
Version 11.30 26 June 2022
    Field     Type
Length
Description
       <OxID />
     integer
        Unique product ID stored in OXATIS Product table.
  <ImageList> <Image>
<OxID />
< T hum bna ilI m g File N a m e /> <ImgFileName /> <ZoomImgFileName /> <ThumbnailImgUrl /> <ImgUrl />
<ZoomImgUrl />
<Position />
</Image> </ ImageList >
  integer string string integer string string string integer
   100 100 100 256 256 256
  Unique product ID stored in OXATIS Product table. Thumbnail image file name.
Main image file name.
Zoomimage filename.
Thumbnail image url. Main image url.
Zoom image url. Additional image position.
 B6)
Product Related Items
<ProductRelatedItems> <OxID />
< UpSellItems>
< UpSellItem> <OxID />
</UpSellItem> </UpSellItems>
< CrossSellItems>
<CrossSellItem> <OxID /> </CrossSellItem>
</CrossSellItems> < LinkedItems>
< LinkedItem> <OxID />
</LinkedItem> </LinkedItems>
</ProductImageList>
➢ Field Definitions, Types and Values
   Field
   Type     Length
  Description
   <OxID />
     integer
       Unique product ID stored in OXATIS Product table.
 <UpSellItems>
< UpSellItem> <OxID />
</UpSellItem> </UpSellItems>
<LinkedItems> <LinkedItem> <OxID />
</LinkedItem> </LinkedItems>
integer
Unique UpSell item ID stored in OXATIS Product table.
Unique Linked item ID stored in OXATIS Product table.
  <CrossSellItems>
< CrossSellItem>
<OxID /> </CrossSellItem>
</CrossSellItem>
         Unique CrossSell item ID stored in OXATIS Product table.
      Page 14 / 57

 B7) Product Reset Fields ➢ XML Structure
OWS API User Guide
Version 11.30 26 June 2022
   <ProductResetFields> <OxID />
< DateOfAvailability />
</ProductResetFields>
   ➢ Field Definitions, Types and Values
<DateOfAvailability /> Boolean If true then the product availability date will be set to null.
B8) Product, Brand and Category Rules
❖ To create or insert a new product, you must define the two following required fields: “ItemSKU” and
“Name” (Do not initialize “OxID” in this current context).
Note: If you need to update or create a product in a specific language, you must use “ItemSKU” in association with “ProductLanguage”.
❖ “OxID” might be used in Get or Updates methods to identify product records in OXATIS Product table.
❖ To delete an existing product, you might use either “OxID” or “ItemSKU”.
❖ When you mention a “TaxRate”, make sure that it is among the list of rates belonging to your OXATIS
admin account.
❖ Before indicating “BigImgFileName” and “SmallImgFileName”, be sure that each file name exists in
your Image Gallery otherwise they will not be attached to your product.
❖ If you need to update “QuantityInStock”, ensure that the product has no options. Otherwise, the
quantity in stock update is ignored.
❖ When you define a Discount Grid Code “DiscountGridCode”, make sure that the same code exists in
your Discount table. Otherwise, it will be ignored.
❖ Updating product brand:
• If the “OxID” is defined in the XML Brand structure, a verification will take place in the OXATIS table of brands to ensure its link to the Product. You can even change the brand name by adding a string value in the “Name” field.
• When only the brand “Name” is defined in the XML Brand structure, a check is made for the given name in the OXATIS table of brands. If it’s not found, then it will be automatically created.
   Field
 Type         Description
  <OxID />
   integer
   Unique product ID stored in OXATIS Product table.
     <Brand> <OxID>0</OxID>
<Name> </Name> </Brand>
      Page 15 / 57

 ❖ Updating product categories:
  • •
If the “OxID” is defined in the XML Category structure, a verification will take place in the OXATIS table of categories to ensure its link to the Product record (This rule also applies to the Customer record and Image record). You can even change the category name by adding a string value in the “Name” field.
When only the category “Name” is defined in the XML Category structure, a check is made for the given name in the OXATIS table of categories. If it’s not found, then it will be automatically created.
Note: You can use the separator “\” in the category name to create a category tree structure. For example: A category name such as “Shirt\Yellow\Small” will create 3 branches in the category tree structure.
•
The “ParentOxID” allows you to check the parent category assigned to the “OxID” category in case it belongs to a tree structure.
<Category>
<OxID>0</OxID> <ParentOxId>0</ParentOxId> <Name> </Name>
</Category>
    Shirt
(OxID = 1, ParentOxID = 0)
OWS API User Guide
Version 11.30 26 June 2022
   ❖ If you are using RTF in “Description” or “Detailed Description” fields, you must:
• Convert RTF data to HTML data.
• Add the following string at the beginning of your content:
<!--#WYSIWYG#-->
Example:
The following colored text Item description is represented in RTF as follows:
{\rtf1\ansi\ansicpg1252\deff0\deflang1036{\fonttbl{\f0\fswiss\fcharset0 Arial;}}
{\colortbl ;\red255\green0\blue255;}
{\*\generator Msftedit 5.41.21.2509;}\viewkind4\uc1\pard\cf1\b\f0\fs20 Item description\cf0\b0\par }
After converting it to HTML you will obtain:
<font size="2" color="#ff00ff"><b>Item description</b></font>
Once converted, precede the HTML above with the following string:
<!--#WYSIWYG#-->
<!--#WYSIWYG#--><font size="2" color="#ff00ff"><b>Item description</b></font>
Yellow
(OxId =2, ParentOxID = 1)
  Small
(OxId =3, ParentOxID = 2)
 Page 16 / 57

 OWS API User Guide
B9) Product with Options Rules
To create or insert a new product with options, you must define the following required fields: “ ItemSKU”, “Name”, “ParentItemSKU”, “ProductType” and then for each option:
• The option type name.
• The option value code and name.
Example of creating a product with 2 options:
Version 11.30 26 June 2022
  <Product>
< ItemSKU> ShirtPL< /Item SKU> <OptionValues1>
<Code>P</Code>
<Name>Pink</Name> </OptionValues1> <OptionValues2>
<Code>L</Code>
< Name> Large< /Na me> </OptionValues2> <OptionTypes1>
<Name>Color</Name> </OptionTypes1> <OptionTypes2>
<Name>Size</Name>
</OptionTypes2> <ParentItemSKU>Shirt</ParentItemSKU> <Name>Shirt</Name> <ProductType>110</ProductType>
</Product>
                    Page 17 / 57

                                                                              B10) Product API Methods
OWS API User Guide
Version 11.30 26 June 2022
  ProductCount
Returns the total number of items.
ProductCountPerLanguage
Returns the total number of items per language.
ProductGet
Returns the whole item.
ProductGetAdditionalImageList
Returns all additional images attached to an item.
ProductGetAllPrices
Returns all prices.
ProductGetAvaibility
Returns stock avaibility.
ProductGetBrand
Returns item brand.
ProductGetCategories
Returns all categories.
ProductGetCost
Returns item cost.
ProductGetDescriptions
Returns item description and detailed description.
ProductGetDiscountGridCode
Returns item discount grid code.
ProductGetEANCode
Returns item EAN code.
ProductGetEcoTaxTI
Returns Ecotax VAT included.
ProductGetGuarantee
Returns item guarantee.
ProductGetHandling
Returns Cost of handling (excl. VAT) of 1st unit and further units.
ProductGetImageFilesName
Returns main and thumbnail file name.
ProductGetItemCode
Returns product code.
ProductGetItemCondition
Returns item condition.
ProductGetItemInStock
Returns the item parameters.
ProductGetLanguage
Returns the current display language.
ProductGetName
Returns item name.
ProductGetPrice
Returns item price one.
ProductGetPrice1
Returns item price two.
ProductGetPrice2
Returns item price three.
ProductGetPrice3
Returns item price four.
ProductGetPrice4
Returns item price five.
ProductGetQuantityInStock
Returns item stock level.
ProductGetQuantityReorder
Returns item reorder threshold.
ProductGetRelatedItems
Returns Upsell,Crossel and linked items.
ProductGetSEOProperties
Returns meta description, meta keyword and meta title. ProductGetShipPrice
Returns shipping price.
ProductGetTaxRate
Returns item VAT rate.
ProductGetUnitsForSale
Returns item units for sale.
ProductGetWeightAndDimensions
Returns weight, height, length and width.
ProductGetList
Returns a paginated list of items OxID for an interval of dates.
ProductDelete
Deletes definetively an item.
ProductDeleteAllCrossSellItems
Deletes all related items to a product.
ProductDeleteAllLinkedItems
Deletes all linked items to a product.
ProductDeleteAllUpSellItems
Deletes all Higher-End items to a product.
ProductDeleteCrossSellItem
Deletes a related item to a product. ProductDeleteLinkedItem
Deletes a linked item to a product.
ProductDeleteUpSellItem
Deletes a Higher-End item to a product.
ProductAddCrossSellItem
Adds a related item to an existing product.
ProductAddLinkedtem
Adds a linked item to an existing product.
ProductAddUpSellItem
Adds a Higher-End item to an existing product.
ProductDuplicate
Duplicate an existing item.
ProductV2Add
Adds a normal item or item with options in OXATIS Product table.
ProductV2Import
Adds or Updates a normal item or item with options in OXATIS Product table.
ProductResetFields
Reset some of product fields.
ProductUpdate
Updates an existing item.
ProductUpdateAllPrices
Updates all prices.
ProductUpdateAvaibility
Updates stock avaibility.
ProductUpdateBrand
Updates item brand.
ProductUpdateCategories
Updates all categories.
ProductUpdateCost
Updates item cost.
ProductUpdateDescriptions
Updates item description and detailed description.
ProductUpdateDiscountgridCode
Updates item grid code.
ProductUpdateEANCode
Updates item EAN code.
ProductUpdateEcoTaxTI
Updates Ecotax VAT included.
ProductUpdateGuarantee
Updates item guarantee.
ProductUpdateHandling
Updates Cost of handling (excl. VAT) of 1st unit and further units.
ProductUpdateImagesFileName
Updates main and thumbnail file name.
ProductUpdateItemCode
Updates item code.
ProductItemCondition
Updates item condition.
ProductUpdateItemInStock
Updates the item parameters.
ProductUpdateLanguage
Updates the current display language.
ProductUpdateName
Updates the item name.
ProductUpdatePrice
Updates product price one.
ProductUpdatePrice1
Updates product price two.
ProductUpdatePrice2
Updates item price three.
ProductUpdatePrice3
Updates item price four.
ProductUpdatePrice4
Updates item price five.
ProductUpdateQuantityInStock
Updates item stock level.
ProductUpdateQuantityReorder
Updates item reorder threshold.
ProductUpdateSEOProperties
Updates meta description, meta keyword and meta title.
ProductUpdateShipPrice
Updates shipping price.
ProductUpdateTaxRate
Updates item VAT rate.
ProductUpdateUnitsForSale
Updates item units for sale.
ProductUpdateWeightAndDimensions
Updates weight, height, length and width.
                                                               Page 18 / 57

 OWS API User Guide
C.PRODUCT WEBLOCK
➢ XML Structure
➢ Field Definition, Types and Values
Version 11.30 26 June 2022
   <ProductWebBlock>
<OxID /> <DescriptionWebBlock /> <LongDescriptionWebBlock />
</ProductWebBlock >
               Field
<OxId /> <DescriptionWebBlock /> <LongDescriptionWebBlock />
Type
integer string string
Length Description
Unique ID stored in OXATIS Product table. 100 Product WebBlock Description.
100 Product WebBlock Long Description.
Instruction
Must be greater than zero.
                              ➢ API method
ProductWebBlockUpdate
Updates WebBlock name in the short description as well as the long description.
D. PRODUCT CHARACTERISTICS
D1) Product Characteristics Update
➢ XML Structure
➢ Field definition, Types and Values
    <Characteristics> <OxID /> <ItemSKU /> <Characteristic>
< Name />
< SysName /> <Values>
<string /> </Values>
</Characteristic> </Characteristics>
              Field Type       Length
<OxId /> integer
<ItemSKU />     string   40
Description
Unique ID stored in OXATIS Product table. Product code.
Instruction
Must be greater than zero.
                    <Characteristic> < Name />
< SysName />
<Values> <string />
</Values> </Characteristic>
           string string
string
      50 50
50
   Characteristic’s name. Characteristic’s system name.
Characteristic’s value.
         Upto50characteristic maximum.
Up to 300 values maximum.
     Example of creating 2 characteristics for a single product:
  <Characteristics> <ItemSKU>Product</ItemSKU> <Characteristic>
<Name>Characteristic 1</Name> <SysName>Characteristic 1</SysName> <Values>
<string>value 1</string> <string>value 2</string> <string>value 3</string> <string>value 4</string>
</Values> </Characteristic> <Characteristic>
<Name>Characteristic 2</Name> <SysName>Characteristic 2</SysName> <Values>
<string>value 5</string>
<string>value 6k</string> </Values>
</Characteristic> </Characteristics>
                    ➢ API Method
   ProductCharacteristicsUpdate
Updates product’s characteristics.
  Page 19 / 57

                                                                          OWS API User Guide
D2) Product Characteristics Get
➢ XML Structure
<CharacteristicsID> <ProductID /> <CharacteristicID>
<OptionTypeID />
<OptionValueID /> </CharacteristicID>
</CharacteristicsID>
➢ Field definition, Types and Values
Version 11.30 26 June 2022
            Field
<ProductID /> <CharacteristicID>
< OptionTypeID />
< OptionValueID /> </Characteristic>
➢ API Method
Type
integer
integer integer
Length
Description
Unique ID stored in OXATIS Product table.
Unique ID stored in Oxatis Option Type table. Unique ID stored in Option value identifier.
Instruction
Must be greater than zero.
                       ProductCharacteristicsGet
Get product’s characteristics.
E. PRODUCT BUNDLES
➢ XML Structure
<Bundle> <OxID>0</OxID> <BundledItem>
<ProductId> <OxID>0</OxID> <ItemSKU> </ItemSKU> <ProductLanguage /> <OptionValues1>
<OxID>0</OxID>
<Name> </Name> </OptionValues1>
<OxID>0</OxID>
<Name> </Name>
</OptionValues1> similar to <OptionValues1> <OptionValues2 /> similar to <OptionValues1> <OptionValues3 /> similar to <OptionValues1> <OptionTypes1>
<OxID>0</OxID>
<Name> </Name>
</OptionTypes1>
<OptionTypes2 /> similar to <OptionTypes1> <OptionTypes3 /> similar to <OptionTypes2> <ParentItemID />
<ParentItemSKU />
<ProductType />
</ProductId>
<Quantity>0</Quantity> </BundledItem>
</Bundle>
 ➢ Field Definitions, Types and Values
           Field Type
<OxId /> integer <ItemSKU /> string
<OptionValues2 /> <OptionValues3 />
<OptionTypes2 />
<OptionTypes3 />
<ParentItemID /> integer
<ParentItemSKU />     string   40 <ProductType />     integer
<Quantity />         integer
Instruction
Must be greater than zero.
Length Description
Unique ID stored in OXATIS Product table. 40 Product code.
similar to <OptionValues1>. similar to <OptionValues1>.
similar to <OptionTypes1>. similar to <OptionTypes1>.
Unique parent Item ID stored in OXATIS Product table.
Parent item code.
Product type.
Bundled item quantity.
Values:
0 Normal
200 Bundle
Value between 1 and 999.
                  <ProductLanguage />
    string
   2
    Product language code.     ISO- 639-1 Code Supported language values:
fr French, en English, es Spanish, de German, it Italian,
nl Dutch, ca Catalan, pt Portuguese.
     < OptionValues1 > <OxID />
<Code />
<Name />
< /OptionValues1 >
  integer
string string
   10 70
  Unique option value ID stored in OXATIS Option Values table.
Option Value code. Option Value name.
  Must be greater than zero.
             <OptionTypes1> <OxID />
<Name /> </OptionTypes1>
   integer string
   50
    Unique option types ID stored in OXATIS Option Types Must be greater than zero. table.
Option Type name.
                                       Page 20 / 57

                                                                                ➢ API Methods
OWS API User Guide
Version 11.30 26 June 2022
  ProductBundleGet ProductBundleUpdate
Returns a list of bulndled OxID for a bundle. Updates or Creates a set of bundled items.
F. PRODUCT ATTRIBUTES
➢XML Structure
<ProductAttributes> <OxID>0</OxID> <ItemSKU> </ItemSKU> <ProductLanguage /> <OptionValues1>
<OxID>0</OxID>
<Name> </Name>
</OptionValues1> similar to <OptionValues1> <OptionValues2 /> similar to <OptionValues1> <OptionValues3 /> similar to <OptionValues1> <OptionTypes1>
<OxID>0</OxID>
<Name> </Name>
</OptionTypes1>
<OptionTypes2 /> similar to <OptionTypes1> <OptionTypes3 /> similar to <OptionTypes2> <ParentItemID />
<ParentItemSKU />
<ProductType />
<TextAttribute>
<Text />
<Type / > </TextAttribute> <MultipleAttribute1>
<Name /> <Type /> <Attributes>
<Attribute>
<DisplayedText /> <AttributeCode /> <AttributeCodeMethod /> <AttributeProductType /> <Price>
<Value />
<VATIncluded /> </Price>
<Price2 /> similar to <Price> <Price3 /> similar to <Price> <Price4 /> similar to <Price> <Price5 /> similar to <Price>
</Attribute> </Attributes>
</MultipleAttribute1>
<MultipleAttribute2 /> similar to<MultipleAttribute1> </ProductAttributes>
➢ Field Definitions, Types and Values
            Field
<OxId /> <ItemSKU />
< OptionValues1 > <OxID />
<Code />
<Name />
< /OptionValues1 > <OptionValues2 /> <OptionValues3 />
Type Length
integer
string 40
integer
string 10
string 70
Description
Unique ID stored in OXATIS Product table. Product code.
Unique option value ID stored in OXATIS Option Values table.
Option Value code. Option Value name.
similar to <OptionValues1>. similar to <OptionValues1>.
similar to <OptionTypes1>.
similar to <OptionTypes1>.
Unique parent Item ID stored in OXATIS Product table. Parent item code.
Product type.
Instruction
Must be greater than zero.
Must be greater than zero.
Values:
0 Normal 200 Bundle
                  <ProductLanguage />
    string
   2
    Product language code.
    ISO- 639-1 Code Supported language values: fr French, en English, es Spanish, de German, it Italian, nl Dutch, ca Catalan, pt Portuguese.
                     <OptionTypes1> <OxID />
<Name /> </OptionTypes1>
       integer string
   50
   Unique option types ID stored in OXATIS Option Types table. Option Type name.
   Must be greater than zero.
 <OptionTypes2 />
<OptionTypes3 />
<ParentItemID />
<ParentItemSKU />     string 40
<ProductType />
               integer integer
               < T e x tA ttr ibute > <Text/>
<Type />
< /T e x tA ttr ibute >
   string enum
   50
   Text attribute.
Text attribute display type.
   Values: SingleLine, MultipleLine, SingleLineRequired or MultipleLineRequired
  < M ultiple A ttr ibute 1 > <Name />
<Type />
< A ttr ibute s>
< A ttr ibute > <DisplayedText /> <AttributeCode />
  string enum
string string
   50
50 10
 Multiple attribute name. Multiple attribute display type.
Displayed text. Attribute code.
   Values: DropDownList orOptionsList
  Page 21 / 57

                              OWS API User Guide
Type Length Description
similar to <MultipleAttribute1>.
Version 11.30 26 June 2022
          Field
<MultipleAttribute2>
➢ API Methods
Instruction
  < A ttr ibute Code M e thod /> < A ttr ibute Pr oductT y pe /> <Price>
<Value />
<VATIncluded /> </Price>
<Price2 /> <Price3 /> <Price4 /> <Price5 />
< A ttr ibute > < A ttr ibute s>
< M ultiple A ttr ibute 1 >
   enum enum
float boolean
      Attribute code method. Attibute product type.
Price 1 value.
With VAT included.
similar to <Price> similar to <Price> similar to <Price> similar to <Price>
    Values: Concatenate or Replace Values: None, Material or Intangible
Must be greater than or equal zero.
false default value
            G. PRODUCT PACKAGING
➢ XML Structure
<ProductPackaging> <OxID /> <PriceIndex />
<ProductPackagingItem> <Name />
<ItemSKU />
<Quantity />
<Price /> </ProductPackagingItem>
<ProductPackaging>
➢ Field Definitions, Types and Values
       Field
<OxID /> <PriceIndex />
➢ API Methods
Type
integer integer
Length
Description
Unique ID stored in OXATIS Customer table. Product price index.
Instruction
Must be greater than zero. Value between 1 and 10.
                        <ProductPackagingItem> <Name />
<ItemSKU /> <Quantity /> <Price />
</ProductPackagingItem>
          string string integer float
   30 40
   Item packaging name. Item packaging code. Item packaging quantity. Item packaging price.
     Value between 1 and 99999. Must be greater than zero.
  ProductDeletePackaging ProductUpdatePackaging
Deletespackagingsrelatedtoaproductpricecategory. UpdatesorCreatesdifferentpackagingsrelatedtoaproductpricecategory.
 Page 22 / 57
 ProductAttributesUpdate
Updates product attributes.

                                                            OWS API User Guide
H. PRODUCT CATEGORIES
H1) Get Product Category
Version 11.30 26 June 2022
➢ XML Structure
<ProductCategory> <OxID /> <Name />
<ParentOxId /> <Header /> <MetaKeywords /> <MetaDescription /> <MetaTitle / > <ImgFileName /> <Description /> <MobileHeader />
<CanonicalURLCustomizedCont ent
<Visibility > <ProductCategory />
/ >
 ➢ Field Definitions, Types and Values
           Field
<OxID /> <Name />
<Header />
<MetaKeywords /> <MetaDescription />
<MetaTitle />
<ImgFileName />
<Description />
<MobileHeader /> <CanonicalURLCustom izedCo nte nt <Visibility >
Type Length
Description
Unique ID stored in OXATIS Product Category table.
Instruction
Visibility returned values:
          integer string
string
string
string
string
string
string       4k
     100
Category
name.
   <ParentOxId />
    integer
       Unique CategoryParent ID stored in OXATIS Product Category table.
                                  string
string     100 integer
header.
meta keywords.
meta description.
meta title.
image file name.
description.
mobile header
canonical URL customized content.
4k 320 320 100 100
Category
Category
Category
Category
Category
Category
Category
Category
Element visibility and work progress.
              4k
        / >
     1 Publish - Element complete
2 Publish in preview
3 Hide - Element complete - Wait before publishing
     H2) Get Product Category collection
➢ XML Structure
<ProductCategoryTreeCollection> <ProductCategoryTree>
<OxID />
<Name />
<Header />
<MetaKeywords /> <MetaDescription />
<MetaTitle />
<ImgFileName />
<Description />
<MobileHeader /> <CanonicalURLCustomizedContent <Visibility >
<ChildCategoryCollection> <ChildCategory>
<OxID />
<Name />
<Header />
<MetaKeywords /> <MetaDescription />
<MetaTitle />
<ImgFileName />
<Description />
<MobileHeader /> <CanonicalURLCustomizedContent <Visibility > <ChildCategoryCollection />
</ChildCategory>
... </ChildCategoryCollection>
</ProductCategoryTree> ...
<ProductCategoryTree /> </ProductCategoryTreeCol lection>
/ >
/ >
  Page 23 / 57

                                                        OWS API User Guide
➢ Field Definitions, Types and Values
Field     Type Length Description     Instruction
Version 11.30 26 June 2022
           <ProductCategoryTreeCollection> <ProductCategoryTree>
<OxID />
<Name />
<Header /> <MetaKeywords /> <MetaDescription /> <MetaTitle /> <ImgFileName /> <Description /> <MobileHeader />
<CanonicalURLCustomizedContent <Visibility >
< C h ild C a te g o r y C o lle c ti o n > <ChildCategory>
... <ChildCategoryCollectio n>
<ChildCategory> ...
</ChildCategory>
< /C hild C a te g o r y C o lle c t io n>
< /C hild C a te g o r y >
< /C hild C a te g o r y C o lle c t io n>
</ProductCategoryTree> ...
<ProductCategoryTree /> </ProductCategoryTreeCollection>
/ >
                                        integer string string string string string string string string string integer
                                      100 4k 320 320 100 100 4k 4k 100
                               Unique ID stored in OXATIS Product Category table. Category name.
Category header.
Category meta keywords.
Category meta description.
Category meta title.
Category image file name.
Category description.
Category mobile header.
Category canonical URL customized content. Element visibility and work progress.
Child category collection. Child category.
Child sub-category collection. Child sub-category.
Etc...
     Visibility returned values:
1 Publish - Element complete
2 Publish in preview
3 Hide - Element complete - Wait before publishing
 H3) Product Category API Methods
 ProductCategoryGet
Returns product category data.
 ProductCategoryGetTreeCollection
Returns product category trees.
 Page 24 / 57

                                                                                                     I. DISCOUNT RULES
I1) Discount Rule related to a Product and a Customer
➢ XML Structure
<DiscountRuleCustomPrice> <OxID />
<UserIdEntity>
<OxID/ >
<Email /> </UserIdEntity> <DiscountRuleEntity>
<Name/ >
<DiscountType/ > <DiscountValue/ > <DiscountCoupon/ > <GridDiscountType/ > <GridLowerStep1Value/ > <GridLowerStep1Result/ > <GridLowerStep2Value/ > <GridLowerStep2Result/ > <GridLowerStep3Value/ > <GridLowerStep3Result/ > <GridLowerStep4Value/ > <GridLowerStep4Result/ > <GridLowerStep5Value/ > <GridLowerStep5Result/ > <GridLowerStep6Value/ > <GridLowerStep6Result/ > <GridLowerStep7Value/ > <GridLowerStep7Result/ > <GridLowerStep8Value/ > <GridLowerStep8Result/ > <GridLowerStep9Value/ > <GridLowerStep9Result/ > <GridLowerStep10Value/ > <GridLowerStep10Result/ > <StartDate />
<EndDate/ > <ShowStrikePrice/ > <Active/ > <StopProcessingDiscount/ >
</DiscountRuleEntity> </DiscountRuleCustomPrice>
➢ Field Definitions, Types and Values
OWS API User Guide
Version 11.30 26 June 2022
     Field       Type Length
Description
Unique ID stored in OXATIS Product table.
Unique ID stored in OXATIS Customer table. Customer’s email.
Instruction
Must be greater than zero.
Must be greater than zero.
Must be a valid formatted email address.
              <OxId /> <UserIdEntity>
<OxID/ >
<Email /> </UserIdEntity>
integer integer
string 255
         < DiscountRule En ti ty >
<Name/ >
<DiscountType/ > <DiscountValue/ > <DiscountCoupon/ > <GridDiscountType/ > <GridLowerStep1Value/ > <GridLowerStep1Result/ > <GridLowerStep2Value/ > <GridLowerStep2Result/ > <GridLowerStep3Value/ > <GridLowerStep3Result/ > <GridLowerStep4Value/ > <GridLowerStep4Result/ > <GridLowerStep5Value/ > <GridLowerStep5Result/ > <GridLowerStep6Value/ > <GridLowerStep6Result/ > <GridLowerStep7Value/ > <GridLowerStep7Result/ > <GridLowerStep8Value/ > <GridLowerStep8Result/ > <GridLowerStep9Value/ > <GridLowerStep9Result/ > <GridLowerStep10Value/ > <GridLowerStep10Result/ > <StartDate/ >
<EndDate/ > <ShowStrikePrice/ > <Active/ > <StopProcessingDiscount / >
< /DiscountRule E nt ity >
                                  string enum float string enum float float float float float float float float float float float float float float float float float float float float datetime datetime boolean boolean boolean
    50 20
   Discount rule name.
Discount value can be either a rate or a price. Discount coupon.
Discount Grid 1st lower step value (Quantity or amount). Discount Grid 1st lower step result (rate or net price). Discount Grid 2nd lower step value (Quantity or amount). Discount Grid 2nd lower step result (rate or net price). Discount Grid 3rd lower step value (Quantity or amount). Discount Grid 3rd lower step result (rate or net price). Discount Grid 4th lower step value (Quantity or amount). Discount Grid 4th lower step result (rate or net price). Discount Grid 5th lower step value (Quantity or amount). Discount Grid 5th lower step result (rate or net price). Discount Grid 6th lower step value (Quantity or amount). Discount Grid 6th lower step result (rate or net price). Discount Grid 7th lower step value (Quantity or amount). Discount Grid 7th lower step result (rate or net price). Discount Grid 8th lower step value (Quantity or amount). Discount Grid 8th lower step result (rate or net price). Discount Grid 9th lower step value (Quantity or amount). Discount Grid 9th lower step result (rate or net price). Discount Grid 10th lower step value (Quantity or amount). Discount Grid 10th lower step result (rate or net price). Start date of validity period.
End date of validity period.
Display strikethrough prices.
Activate discount rule.
Stop processing other discount rules.
    Values: Percentage or NewPrice.
Discount rate value must be between 0 and 100.
Values: None, Quantity, Amount or NewPrice.
   Page 25 / 57

                                                                                                    OWS API User Guide
I2) Discount Rule Linked to Product Price
➢ XML Structure
<DiscountRuleLinkToProductPrice> <OxID />
<PriceIndex /> <DiscountRuleEntity>
<Name/ >
<DiscountType/ > <DiscountValue/ > <DiscountCoupon/ > <GridDiscountType/ > <GridLowerStep1Value/ > <GridLowerStep1Result/ > <GridLowerStep2Value/ > <GridLowerStep2Result/ > <GridLowerStep3Value/ > <GridLowerStep3Result/ > <GridLowerStep4Value/ > <GridLowerStep4Result/ > <GridLowerStep5Value/ > <GridLowerStep5Result/ > <GridLowerStep6Value/ > <GridLowerStep6Result/ > <GridLowerStep7Value/ > <GridLowerStep7Result/ > <GridLowerStep8Value/ > <GridLowerStep8Result/ > <GridLowerStep9Value/ > <GridLowerStep9Result/ > <GridLowerStep10Value/ > <GridLowerStep10Result/ > <StartDate />
<EndDate/ > <ShowStrikePrice/ > <Active/ > <StopProcessingDiscount/ >
</DiscountRuleEntity> </DiscountRuleLinkToProductPrice>
➢ Field Definitions, Types and Values
Version 11.30 26 June 2022
     Field       Type
Length
Description
Unique ID stored in OXATIS Product table. Product price index.
Instruction
Must be greater than zero.
Value must be between 1 and 10.
              <OxId />
<PriceIndex />     Integer
integer
       < DiscountRule En ti ty >
<Name/ >
<DiscountType/ > <DiscountValue/ > <DiscountCoupon/ > <GridDiscountType/ > <GridLowerStep1Value/ > <GridLowerStep1Result/ > <GridLowerStep2Value/ > <GridLowerStep2Result/ > <GridLowerStep3Value/ > <GridLowerStep3Result/ > <GridLowerStep4Value/ > <GridLowerStep4Result/ > <GridLowerStep5Value/ > <GridLowerStep5Result/ > <GridLowerStep6Value/ > <GridLowerStep6Result/ > <GridLowerStep7Value/ > <GridLowerStep7Result/ > <GridLowerStep8Value/ > <GridLowerStep8Result/ > <GridLowerStep9Value/ > <GridLowerStep9Result/ > <GridLowerStep10Value/ > <GridLowerStep10Result/ > <StartDate/ >
<EndDate/ > <ShowStrikePrice/ > <Active/ > <StopProcessingDiscount / >
< /DiscountRule E nt ity >
                                  string enum float string enum float float float float float float float float float float float float float float float float float float float float datetime datetime boolean boolean boolean
    50 20
    Discount rule name.
Discount value can be either a rate or a price. Discount coupon.
Discount Grid 1st lower step value (Quantity or amount). Discount Grid 1st lower step result (rate or net price). Discount Grid 2nd lower step value (Quantity or amount). Discount Grid 2nd lower step result (rate or net price). Discount Grid 3rd lower step value (Quantity or amount). Discount Grid 3rd lower step result (rate or net price). Discount Grid 4th lower step value (Quantity or amount). Discount Grid 4th lower step result (rate or net price). Discount Grid 5th lower step value (Quantity or amount). Discount Grid 5th lower step result (rate or net price). Discount Grid 6th lower step value (Quantity or amount). Discount Grid 6th lower step result (rate or net price). Discount Grid 7th lower step value (Quantity or amount). Discount Grid 7th lower step result (rate or net price). Discount Grid 8th lower step value (Quantity or amount). Discount Grid 8th lower step result (rate or net price). Discount Grid 9th lower step value (Quantity or amount). Discount Grid 9th lower step result (rate or net price). Discount Grid 10th lower step value (Quantity or amount). Discount Grid 10th lower step result (rate or net price). Start date of validity period.
End date of validity period.
Display strikethrough prices.
Activate discount rule.
Stop processing other discount rules.
    Values: Percentage or NewPrice.
Discount rate value must be between 0 and 100.
Values: None, Quantity, Amount or NewPrice.
   Page 26 / 57

                                                                                                     OWS API User Guide
I3) Discount Rule related to a Product Family and a Customer
Version 11.30 26 June 2022
➢ XML Structure
<DiscountRuleProductFamilyUser> <FamilyName />
<UserIdEntity>
<OxID/ >
<Email /> </UserIdEntity> <DiscountRuleEntity>
<Name/ >
<DiscountType/ > <DiscountValue/ > <DiscountCoupon/ > <GridDiscountType/ > <GridLowerStep1Value/ > <GridLowerStep1Result/ > <GridLowerStep2Value/ > <GridLowerStep2Result/ > <GridLowerStep3Value/ > <GridLowerStep3Result/ > <GridLowerStep4Value/ > <GridLowerStep4Result/ > <GridLowerStep5Value/ > <GridLowerStep5Result/ > <GridLowerStep6Value/ > <GridLowerStep6Result/ > <GridLowerStep7Value/ > <GridLowerStep7Result/ > <GridLowerStep8Value/ > <GridLowerStep8Result/ > <GridLowerStep9Value/ > <GridLowerStep9Result/ > <GridLowerStep10Value/ > <GridLowerStep10Result/ > <StartDate />
<EndDate/ > <ShowStrikePrice/ > <Active/ > <StopProcessingDiscount/ >
</DiscountRuleEntity> </DiscountRuleProductFamilyUser>
➢ Field Definitions, Types and Values
       Field
<FamilyName /> <UserIdEntity>
<OxID/ >
<Email /> </UserIdEntity>
Type Length
string 100 integer
string 255
Description
Product family name.
Unique ID stored in OXATIS Customer table. Customer’s email.
Instruction
Must be greater than zero.
Must be a valid formatted email address.
                        < DiscountRule En ti ty >
<Name/ >
<DiscountType/ > <DiscountValue/ > <DiscountCoupon/ > <GridDiscountType/ > <GridLowerStep1Value/ > <GridLowerStep1Result/ > <GridLowerStep2Value/ > <GridLowerStep2Result/ > <GridLowerStep3Value/ > <GridLowerStep3Result/ > <GridLowerStep4Value/ > <GridLowerStep4Result/ > <GridLowerStep5Value/ > <GridLowerStep5Result/ > <GridLowerStep6Value/ > <GridLowerStep6Result/ > <GridLowerStep7Value/ > <GridLowerStep7Result/ > <GridLowerStep8Value/ > <GridLowerStep8Result/ > <GridLowerStep9Value/ > <GridLowerStep9Result/ > <GridLowerStep10Value/ > <GridLowerStep10Result/ > <StartDate/ >
<EndDate/ > <ShowStrikePrice/ > <Active/ > <StopProcessingDiscount / >
< /DiscountRule E nt ity >
                                  string enum float string enum float float float float float float float float float float float float float float float float float float float float datetime datetime boolean boolean boolean
    50 20
    Discount rule name.
Discount value can be either a rate or a price. Discount coupon.
Discount Grid 1st lower step value (Quantity or amount). Discount Grid 1st lower step result (rate or net price). Discount Grid 2nd lower step value (Quantity or amount). Discount Grid 2nd lower step result (rate or net price). Discount Grid 3rd lower step value (Quantity or amount). Discount Grid 3rd lower step result (rate or net price). Discount Grid 4th lower step value (Quantity or amount). Discount Grid 4th lower step result (rate or net price). Discount Grid 5th lower step value (Quantity or amount). Discount Grid 5th lower step result (rate or net price). Discount Grid 6th lower step value (Quantity or amount). Discount Grid 6th lower step result (rate or net price). Discount Grid 7th lower step value (Quantity or amount). Discount Grid 7th lower step result (rate or net price). Discount Grid 8th lower step value (Quantity or amount). Discount Grid 8th lower step result (rate or net price). Discount Grid 9th lower step value (Quantity or amount). Discount Grid 9th lower step result (rate or net price). Discount Grid 10th lower step value (Quantity or amount). Discount Grid 10th lower step result (rate or net price). Start date of validity period.
End date of validity period.
Display strikethrough prices.
Activate discount rule.
Stop processing other discount rules.
    Values: Percentage or NewPrice.
Discount rate value must be between 0 and 100.
Values: None, Quantity, Amount or NewPrice.
   Page 27 / 57

 OWS API User Guide
I4) Discount Rule Compute Mode
➢ XML Structure
➢ Field Definitions, Types and Values
Field Type Description Instruction
I5) Discount Rules API Methods
Version 11.30 26 June 2022
   <DiscountRuleComputeMode> < ComputeMode/>
</ DiscountRuleComputeMode >
              <ComputeMode />
     integer Discount rule compute mode.
     Accepted values:
0 Priority to item discounts (Custom discount / discount linked to price). 1 Priority to item families.
2 Priority to the customer discount.
3 Sum of discounts.
4 Successive discounts applied (Successive Mode).
       DiscountRuleCustomPriceUpdate
Creates or Updates a discount rule related to a product and a customer.
DiscountRuleDelete
Deletes a discount rule. DiscountRuleLinkToProductPriceUpdate
Updates or Creates a discount rule related to a product price category.
 DiscountRuleProductFamilyUserUpdate
Updates or Creates a discount rule related to a product family and a customer.
DiscountRuleUpdateComputeMode
Updates discount rule compute mode.
 Page 28 / 57

 J. CUSTOMERS
J1) Customer
➢ XML Structure
OWS API User Guide
Version 11.30 26 June 2022
   <User>
<OxID />
<Email />
<BillingTitle />
<FirstName />
<LastName />
<Company />
<VATNumber /> <BillingAddressStreet /> <BillingAddressOtherInfo /> <BillingZipCode /> <BillingCity />
<BillingState />
< BillingStateNam e /> <BillingCountryISOCode /> <BillingPhone /> <BillingCellPhone /> <BillingFax />
<ShippingTitle /> <ShippingFirstName /> <ShippingLastName /> <ShippingCompany /> <ShippingPhone />
< ShippingAddressStre et/> <ShippingAddressOtherInfo /> <ShippingCompany /> <ShippingZipCode /> <ShippingCity> /> <ShippingState />
< ShippingStateNam e /> <ShippingCountryISOCode /> <SalesRepCode /> <SubscribeToNewlett ers /> <SubscribeToSMSCamp aign /> <CustomerAccount /> <Category1>
                                    <OxID />
<Name /> </Category1> <Category2 /> <Category3 /> <Category4 /> <UserLanguage /> <PriceIndex /> <Discount /> <DiscountCartItems /> <DiscountGridCode /> <FiscalCode /> <BirthDate /> <Comments /> <RewardPoints /> <LastUpdateDate /> <CustomFieldText1 /> <CustomFieldText2 /> <CustomFieldText3 /> <CustomFieldText4 /> <CustomFieldNumeric1 <CustomFieldNumeric2 <CustomFieldDate /> <UserTypology /> <LegalForm /> <NAFCode /> <CreationDate /> <Source /> <CustomerCode />
</User>
to <Category1> to <Category1> to <Category1>
/> />
   simila r simila r simila r
                           Page 29 / 57

                                                                                 OWS API User Guide
➢ Field Definitions, Types and Values
Version 11.30 26 June 2022
           Field
<OxId /> <Email />
Type
integer string
string string string string string string string string string string string string string string
string
string string string string string string string string string string string string boolean boolean boolean
integer integer string
string
float
float string string
datetime
string integer datetime string string string string
f loat
f loat datetime
string
datetime string string
Length Description
Unique ID stored in OXATIS Customer table. 255 Contact email.
30 Contact first name (Billing Address). 50 Contact last name (Billing Address). 50 Company name.
16 Company VAT number.
50 Street name and number (Billing Address). 50 Locality, other information (Billing Address). 20 Postal code (Billing Address).
30 City or town (Billing Address).
30 State, region, province or county (Billing Address). 50 State name (Billing Address).
2 Country ISO 3166-2 Code (Billing Address). 30 Telephone (Billing Address).
30 Mobile (Billing Address).
30 Fax (Billing Address).
30 Contact title (Shipping Address).
30 Contact first name (Shipping Address).
50 Contact last name (Shipping Address).
50 Company name (Shipping Address).
30 Phone (Shipping Address).
50 Street name and number (Shipping Address). 50 Locality, other information (Shipping Address). 20 Postal code (Shipping Address).
30 City or town (Shipping Address).
30 State, region, province or county (Shipping Address). 50 State name (Shipping Address).
2 Country ISO 3166-2 Code (Shipping Address). 10 Sales representative Code.
Customer newsletter subscription. Customer SMS Camaign subscription. Credit customer.
Unique category ID stored in OXATIS Category table.
Parent category ID stored in OXATIS Category table. 100 Category name.
similar to <Category1>. similar to <Category1>. similar to <Category1>.
Customer preferred language.
Global discount rate.
Default discount for each item in the cart.
6 Discount Grid Code.
30 Customer Business Registration Number.
Customer date of birth.
4kb Additional information.
Available points (Loyalty Program).
Date of last update. 100 1st Custom Text Field. 100 2nd Custom Text Field. 100 3rd Custom Text Field. 100 4th Custom Text Field.
1st Custom Numeric Field. 2nd Custom Numeric Field. Custom Date Field.
40 Company legal form. Customer date of creation.
100 Micro-survey source. 50 Customer code.
Instruction
Must be greater than zero.
Must be a valid formatted email address.
                  < Billing T itle />
   string
   30
     Accepted values:
Contact title (Billing Address). Mr, Mrs, Miss, Ms, Sir, Madam, Lord, Lady, Dr, Judge,
Rev, Mx.
     <FirstName /> <LastName /> <Company /> <VATNumber />
< Billing A ddr e ssStr e e t
< Billing A ddr e ssOthe r I nfo
< Billing Z ipCode
< Billing City />
< Billing Sta te />
< Billing Sta te N a m e
< Billing Countr y I SO Code < Billing Phone />
< Billing Ce llPhone <BillingFax />
< Shipping T itle />
                              />
          />
     />
                         /> />
/>
Available only for the United States, Spain and Canada. i.e: FR France, IT Italy, GB Great Britain, ES Spain...
Accepted values:
Mr, Mrs, Miss, Ms, Sir, Madam, Lord, Lady, Dr, Judge, Rev, Mx.
Available only for the United States, Spain and Canada. i.e: FR France, IT Italy, GB Great Britain, ES Spain...
Must exist in OXATIS Sales representative table.
false default value
false default value false default value
Must be greater than zero.
Must be greater than or equal zero.
ISO- 639-1 Code Supported language values:
fr French, en English, es Spanish, de German, it Italian, nl Dutch, ca Catalan, pt Portuguese.
Must be greater than or equal to zero and less than or equal to 100.
Must exist in OXATIS Discount Grid table.
Must be greater than 01/01/1901 and less than 12/31/2100.
                                             < Shipping Fir stN ame <ShippingLastName />
< Shipping Company />
< Shipping Phone />
< Shipping A ddr e ssStr e e t
< Shipping A ddr e ssOthe r I nfo
/>
                              />
               < Shipping Z ipCode
< Shipping City />
< Shipping State />
< Shipping Sta te N a m e <ShippingCountryISOC ode <SalesRepCode />
/>
/>
/>
                    />
                         < Subscr ibe T oN e wle tte r s
< Subscr ibe T oSM SCampaig n/> <CustomerAccount /> <Category>
/>
                    <OxID /> <ParentOxId /> <Name />
</Category1> <Category2 /> <Category3 /> <Category4 />
<UserLanguage />
<Discount />
<DiscountCartItems /> <DiscountGridCode /> <FiscalCode />
<BirthDate />
<Comments /> <RewardPoints /> <LastUpdateDate /> <CustomFieldText1 /> <CustomFieldText2 /> <CustomFieldText3 /> <CustomFieldText4 /> < CustomFie ldN ume r ic1 < CustomFie ldN ume r ic2 <CustomFieldDate />
<LegalForm />
<CreationDate /> <Source /> <CustomerCode />
/> />
                                <PriceIndex />
   integer
       Price index to use.
Value between 0 (index used for Price 1) and 9 (index used for Price 10).
-1: is the default value (depending on the first customer category).
                                                                                                             <UserTypology />
   byte
       Values: Defines B2B or B2C customer. 1 B2C 2 B2B
    <NAFCode />
   string
   20
    NAF code (French activity nomenclature issued by INSEE and called the APE Code).
                 Only alphanumeric characters are accepted.
      Page 30 / 57

                                                                              OWS API User Guide
J2) Customer Shipping Address
➢ XML Structure
<UserShippingAddress> <OxID />
<Email /> <AddressLabel /> <Title />
<FirstName /> <LastName /> <Company /> <AddressStreet /> <AddressOtherInfo /> <ZipCode />
<City />
<State /> <CountryISOCode /> <Phone /> <DefaultAddress /> <AddressID />
</UserShippingAddress>
➢ Field Definitions, Types and Values
Version 11.30 26 June 2022
            Field
<OxID /> <Email />
<Title />
<LastName />
<AddressStreet />
<ZipCode />
<State /> <CountryISOCode /> <DefaultAddress />
J3) Customer List
Type Length
Description
Unique customer ID stored in OXATIS Customer table. Customer’s email.
Contact title.
Contact last name.
Street name and number.
Postal code.
State, region, province or county.
Country ISO 3166-2 Code.
Set the default customer shipping address.
Instruction
Accepted values :
Mr, Mrs, Miss, Ms, Sir, Madam, Lord, Lady, Dr, Judge, Rev, Mx.
i.e: FR France, IT Italy, GB Great Britain, ES Spain...
          Integer string
string
string string string string string boolean
255 30
30 50 20 30 2
       <AddressLabel />
   string
   64
   Address label.
      <FirstName />
   string
   30
   Contact first name.
      <Company />
   string
   50
   Company name.
      <AddressOtherInfo />
   string
   50
   Locality, other information.
      <City />
   string
   50
   City or town.
      <StateName />
   string
   50
   State name.
   Available only for the United States, Spain and Canada.
   <Phone />
   string
   30
   Telephone.
      <AddressID />
   integer
      Unique ID stored in OXATIS Customer Shipping Address table.
    ➢ XML Structure
<UserList> <PageInformation>
<PageNumber /> <PageSize /> <TotalItems /> <TotalPages />
</PageInformation> <LatestModifiedDateSt art /> <LatestModifiedDateEnd /> <UsersID />
<UserID> <OxID />
<UserID> </UserList >
 ➢ Field Definitions, Types and Values
     Field
<LatestModifiedDateStart />
<LatestModifiedDateEnd />
<OxID />
Type         Description
Instruction
Must be greater than January 1, 2000.
Must be greater than January 1, 2000.
     <PageInformation> <PageNumber /> <PageSize /> <TotalItems /> <TotalPages />
</PageInformation>
integer integer integer integer
The page number to request.
The page size to request.
Total items retrieved in OXATIS Customer table.
Total pages are calculated according to the total items and the page size.
Must be greater than zero. Must be greater than zero.
    datetime
datetime
integer
Start date of last customer modification.
End date of last customer modification.
Unique ID stored in OXATIS Customer table.
              Page 31 / 57

 J4) Customer API Methods
OWS API User Guide
Version 11.30 26 June 2022
  UserGet
Returns all data in customer record.
UserGetBillingAddress
Returns the customer billing address, postal code, city, state and country iso- code.
UserGetShippingAddressLines
Returns the customer billing address as 4 seperated lines, postal code, city, state and country iso- code.
UserGetShippingAddress
Returns the uses shipping address, postal code, city, state and country iso- code. UserGetFisrtName
Returns the uses first name.
UserGetDiscount
Returns the uses discount rate.
UserGetDiscountGridCode
Returns the customer discount grid code.
UserGetLastName
Returns the customer last name.
UserGetCompanyName
Returns the customer company name.
UserGetCompanyVATNumber
Returns the customer company VAT number.
UserGetCategories
Returns all customer categories (1 to 4 categories).
UserGetLanguage
Returns the customer preferred language.
UserGetPriceIndex
Returns the customer price index.
UserGetCustomerAccount
Returns the customer credit customer value.
UserGetSubscribeToNewletters
Returns newsletter subscription value.
UserGetSalesCodeRep
Returns customer sales representative code.
UserGetEmail
Returns customer email.
UserGetList
Returns a paginated list of customers OxID for an interval of dates.
UserGetFiscalCode
Returns customer Bus Reg No.
UserGetBirthDate
Returns customer date of birth.
UserDelete
Deletes definetively a customer.
UserDeleteShippingAddress
Deletes definetively an additionnal shipping address.
                                              UserAdd
Adds a customer in OXATIS Customer table.
UserImport
Adds or Updates a customer in OXATIS Customer table.
UserUpdate
Updates an existing customer.
UserUpdateAdditionalShippingAddress
Adds or Updates an additionnal shipping address.
UserUpdateBillingAddress
Updates use billing address, postal code, city, state and country iso- code.
UserUpdateBillingAddressLines
Updates customer billing address lines (1 to 4 lines).
UserUpdateDiscount
Updates the customer discount rate.
UserUpdateDiscountGridCode
Updates the customer discount grid code.
UserUpdateShippingAddress
Updates customer shipping address, postal code, city, state and country iso- code.
UserUpdateShippingAddressLines
Updates customer shipping address lines (1 to 4 lines).
UserUpdateFisrtName
Updates customer first name.
UserUpdateLastName
Updates customer last name.
UserUpdateCompanyName
Updates customer company name.
UserUpdateCompanyVATNumber
Updates customer company VAT number.
UserUpdateCategories
Updates us customer er all categories (1 to 4 categories).
UserUpdateLanguage
Updates customer preferred language.
UserUpdatePriceIndex
Updates customer price index.
UserUpdateCustomerAccount
Updates customer credit customer value.
UserUpdateSubscribeToNewletters
Updates newsletter subscription value.
UserUpdateSalesCodeRep
Updates customer sales representatice code.
UserUpdateEmail
Updates customer email.
UserUpdateFiscalCode
Updates customer Bus Reg No.
UserUpdateBirthDate
Updates customer date of birth.
                                              J5) Management Rules for Customers and Categories
❖ To create or insert a new customer, you must define a unique valid email address (Do not initialize “OxID” in this current context).
❖ “OxID” might be used in Get or Updates methods to identify customer records in the OXATIS customer table.
❖ To delete an existing customer, you might use either “OxID” or “email”.
❖ When you define a Sales Representative Code “SalesRepCode”, make sure that the same code exists in your Sales
Rep File. Otherwise, it will be ignored. The same rule applies to the customer “DiscountGridCode”.
❖ If the address billing country code or shipping country code does not correspond to a valid code, an error will
occur.
❖ If the customer preferred language code does not correspond to one of the required language codes: en, fr, it,
nl, es, de, ca or pt, the default admin language will be used.
❖ Price index value should be between -1 and 4. (-1 = none; 0 = Price 1; 1 = Price 2; ...; 4 = Price 5). The default
value is -1.
❖ Updating customer categories: please refer to updating product categories (section B4).
❖ When you update a customer 's billing or shipping address, there is an order of priority if the zones below are
filled in:
1 - The standardized address (street and other information) 2 - The address split into several lines
3 - The address block
   Page 32 / 57

                                                           K.IMAGES
K1) ImageGallery
➢ XML Structure
<ImageGallery>
<OxID />
<Name /> <RefPathFileName /> <Url />
<Category> <OxID /> <ParentOxId /> <Name />
</Category> </ImageGallery>
➢ Field Definitions, Types and Values
OWS API User Guide
Version 11.30 26 June 2022
            Field
<OxId /> <Name />
<RefPathFileName /> <Url />
<Category>
<OxID /> <ParentOxId /> <Name />
</Category>
<DynamicImages />
K2) ImageGalleryList
➢ XML Structure
<ImageGalleryList> <PageInformation>
<PageNumber /> <PageSize /> <TotalItems /> <TotalPages />
</PageInformation> <ImageGalleryId List>
<ImageGalleryId> <OxID /> <Name />
<FileName />
<ImageUrl /> </ImageGalleryId>
</ImageGalleryId List> </ImageGalleryList>
Type Length
integer
string 100
string 250 string 256
integer
integer
string 100
boolean
Description
Unique ID stored in OXATIS Image gallery table. Image name.
Root path file name. Image URL source.
Unique category ID stored in OXATIS Category table. Parent category ID stored in OXATIS Category table. Category name.
Images will be processed dynamically.
Instruction
Must be greater than zero.
Maximum length must be less than the URL length. Must be a valid URL.
Must be greater than zero.
Must be greater than or equal zero.
Default value: null or false.
                  <FileName />
    string
     256 Image file name.
     Image file name with supported extension: .jpg, .jpeg, .gif, .png
                    < M e d ia C o n te n t> <MediaType />
<StrBytes>
< /M e d ia C o nte nt>
       string string
      Image Type.
256 Base64 encoded string representation.
      Constant supported values: image/gif, image/jpg, image/jpeg and image/png
Original image file size cannot exceed 1Mb.
         ➢ Field Definitions, Types and Values
Len gth
integer
string 100 string 100 string 256
➢ API Methods
     Field
Description Instruction
      <PageInformation> <PageNumber /> <PageSize /> <TotalItems /> <TotalPages />
</PageInformation>
The page number to request.
The page size to request.
Total items retrieved in OXATIS Image gallery table.
Total pages are calculated according to the total items and the page size.
Must be greater than zero. Must be greater than zero.
        <ImageGalleryIdList> <ImageGalleryId>
<OxID /> <Name /> <FileName />
<ImageUrl /> </ImageGalleryId> </ImageGalleryIdList>
Unique ID stored in OXATIS Image gallery table. Image name.
Image file name.
Image URL source.
    Type
integer integer integer integer
   ImageDelete
Deletes definetively an image.
ImageGet
Returns image record data.
ImageGetList
Returns a paginated list of images.
ImageImportFromUrl
Imports an image from an existing URL in OXATIS Images Gallery table.
 ImageImportFromStrBytes
Addsa imageinOXATISImagesGallerytableorupdatesanexisting image from a Base64 string representation.
 Page 33 / 57

 OWS API User Guide
K3) Management Rules for Images and Categories
❖ Only GIF, JPEG, JPG and PNG picture files are supported.
❖ Picture file size cannot exceed 2048 Kb.
❖ To delete an existing image, you might use either “OxID” or “Image name”.
❖ “OxID” might be used in “ImportImage” method to identify image records in OXATIS Image Gallery
table.
❖ To create or insert a new image from a Base64 encoded string representation, you must define the
two following required fields “Name”, “FileName” and “MediaContent”. (Do not initialize “OxID” in
this current context).
❖ To create or insert a new image from a valid URL, you must define the two following required fields
“Name” and “URL”. (Do not initialize “OxID” in this current context).
The reference file path name “RefPathFileName” is considered as the root path of the image file to
upload.
For example, if the URL of the image to upload is: https://images.mydomain.com/pictures/products/pic001.jpg andyouwouldliketoomitafixedpart of the URL (such as, https://images.mydomain.com), then you can define it as “RefPathFileName”. In this case, the relative path file name to be stored in your image gallery will be as follows: pictures/products/pic001.jpg
❖ Updating image categories: please refer to updating product categories (section B4).
Version 11.30 26 June 2022
      Page 34 / 57

                                                                  L. SALES ORDERS
L1) Order
➢ XML Structure
OWS API User Guide
Version 11.30 26 June 2022
   <Order> <OxID />
<Date />
<UserEmail />
<UserOxID/>
<BillingTitle /> <BillingCompany /> <BillingFirstName /> <BillingLastName /> <BillingAddressStreet /> <BillingAddressOtherInfo /> <BillingZipCode /> <BillingCity />
<BillingState />
<BillingCountryISOCode /> <BillingCountryName />
<BillingPhone />
<BillingCellPhone />
<BillingFax />
<CompanyVATNumber />
<VATIncluded />
<EcoTaxIncluded />
<SubTotalNet /> <SubTotalNetDiscounted /> <GlobalDiscountRate /> <GlobalDiscountAmount /> <SubTotalVAT />
<ShippingMethodName /> <ShippingTaxRate /> <ShippingPriceTaxExcl /> <ShippingPriceTaxIncl /> <ShippingVATAmount /> <EcoTaxAmountTaxIncl /> <PaymentFeesTaxR at e /> <PaymentFeesTax Exc /> <PaymentFeesTax Inc /> <PaymentFeesVATA mount /> <CashOnDelivery/>
<NetAmountDue />
<TotalWeight />
<CartCoupon /> <LogisticsServiceProviderAcc ess> /> <LogisticsServiceProviderInstructions /> <Language />
< PaymentMethodNam e/> <PaymentStatusCode />
< PaymentStautsLastModifie d> /> <PMProcessorCode /> <RemoteIPAddr />
<SalesRepCode />
< SalesRepFirstNam e />
< SalesRepLastNam e /> <ShippingCompany /> <ShippingUserID /> <ShippingAddressLabel /> <ShippingTitle /> <ShippingFirstName /> <ShippingLastName /> <ShippingAddressStreet/> <ShippingAddressOtherInfo /> <ShippingZipCode /> <ShippingCity />
<ShippingState /> <ShippingCountryISOCode /> <ShippingCountryName /> <ShippingPhone />
<ShippingInfo /> <SpecialInstructions /> <CurrencyCode />
<InvoiceDate />
<InvoiceID />
<InvoiceFileName />
<InvoiceURL />
<InternalNote /> <ShippingProcessorCode /> <ShippingParam1 /> <ShippingParam2 />
<FiscalCode />
<TrackingNumber />
<TrackingUrl />
<TransportName />
<SourceTypeID /> <SourceOrderID /> <Shipped /> <CustomFieldText1 /> <CustomFieldText2 /> <CustomFieldText3 /> <CustomFieldText4 /> <CustomFieldNumeric1 /> <CustomFieldNumeric2 /> <CustomFieldDate /> <CampaignTrackin gID/> <UserTypology /> <LegalForm />
<NAFCode /> <TrackingNumber /> <CustomerCode />
                                                                                                 <Gift / <GiftMessage /> < OrderItems>
<Item>
<ItemOXID />
<ItemSKU /> <ItemSKUOriginal /> <ItemName /> <Quantity /> <GrossPrice /> <LineGrossAmount /> <TaxRate /> <DiscountRate /> <NetPrice /> <LineNetAmount /> <LineVATAmount /> <EcoTaxPriceTaxIncl /> <DiscountCoupon /> <Attribute1Name /> <Attribute1Value /> <Attribute2Name /> <Attribute2Value /> <AttributeTextName /> <AttributeTextValue /> <Option1Name /> <Option1Value /> <Option2Name /> <Option2Value /> <Option3Name /> <Option3Value /> <ItemMainImageU RL />
< ItemThumbnailIma g <Offered />
< PackagingQty/>
< PackagingName/>
< LinkedTo/>
< Weight/>
< DimensionHeight/> < DimensionLength/> <DimensionWidth/>
< BundledItems>
< BundledItem>
eURL />
<ItemOXID />
<ItemSKU />
<ItemName />
<Quantity />
<Option1Name /> <Option1Value /> <Option2Name /> <Option2Value /> <Option3Name /> <Option3Value /> <ItemMainImageUR L /> <ItemThumbnailImageU RL /> <Offered />
</BundledItem> </BundledItems>
</Item>
</ OrderItems>
<OrderTaxDetails> <TotalNetTaxExcl />
<TaxRate />
<TotalNetVATAmount /> </OrderTaxDetails>
</Order>
 Page 35 / 57

                                                                                                          OWS API User Guide
➢ Field Definitions, Types and Values
Version 11.30 26 June 2022
         Field
<OxId/> <Date />
Type Length
Description
Unique ID stored in OXATIS Sales Order table. Sales Order date.
Contact email.
Unique ID stored in OXATIS Customer table. Contact title (Billing address).
Company name (Billing address).
Contact first name (Billing address).
Contact last name (Billing address).
Street name and number (Billing address). Locality, other information (Billing address). Postal code (Billing address).
City name (Billing address).
State (Billing address).
State name (Billing address).
Country ISO 3166-2 Code (Billing address). Country name (Billing address).
Telephone (Billing address).
Mobile (Billing address).
Fax (Billing address).
Company VAT Number.
Indicates whether the ecotax is included or not in the item price.
Subtotal of shopping cart after applying the global discount.
Global discount rate.
Global discount amount.
VAT subtotal.
Shipping method name.
Shipping VAT rate.
Shipping price excluding VAT.
Shipping price including VAT.
Shipping VAT amount.
Ecotax amount including VAT.
Payment fees VAT rate.
Payment fees excluding VAT.
Payment fees including VAT.
Payment fees VAT amount.
Cash on delivery.
Shopping cart net amount due.
Total weight.
Special offer code (discount coupon). Logistics service provider last access date. Logistics service provider instructions. Sales Order language.
Payment method name.
Payment Last modified date. Remote IP address.
Sales representative code.
Sales representative first name. Sales representative last name. Company name (Shipping address).
Shipping address label.
Contact title (Shipping address).
Contact first name (Shipping address).
Contact last name (Shipping address).
Street name and number (Shipping address). Locality, other information (Shipping address). Postal code (Shipping address).
City name (Shipping address).
State (Shipping address).
State name (Shipping address).
Country ISO 3166-2 Code (Shipping address). Country name (Shipping address).
Telephone (Shipping address).
Shipping information.
Special instructions.
Invoice date. Invoice ID. Invoice file name. Invoice URL. Internal note.
Instruction
Must be greater than zero. ISO 8601 format
        integer datetime
string integer string string string string string string string string string string string string string string string string
boolean
float
float float float string float float float float float float float float float Boolean float integer string datetime string string
string
datetime string string string string string
string string string string string string string string string string string string string string string
datetime string string string string
(YYYY-MM-DDThh:mm:ss )
is used for Datetime.
            <UserEmail /> <UserOxID/>
< Billing T itle />
< Billing Company
< Billing Fir stN ame <BillingLastName />
< Billing A ddr e ssStr e e t
< Billing A ddr e ssOthe r I nfo < Billing Z ipCode />
< Billing City />
< Billing Sta te />
< Billing Sta te N a m e
< Billing Countr y I SO Code
255
30 50 30 50 50 50 20 50 30 50 2 50 30 30 30 16
100
20
100 2
100
50 10 30 50 50
64 30 30 50 50 50 20 50 30 50 2 50 30 255 4kb 3
25 50
250
                /> />
                    />
                            />
< Billing Countr y N ame < Billing Phone />
/>
/>
Available only for the United States, Spain and Canada. i.e: FR France, IT Italy, GB Great Britain, ES Spain...
            />
            < Billing Ce llPhone <BillingFax /> <CompanyVATNumber />
/>
              <VATIncluded />
   boolean
   Computing mode: including or excluding VAT.
   true Including VAT false default value
 <EcoTaxIncluded />
<SubTotalNetDiscounte d
<GlobalDiscountRate /> <GlobalDiscountAmoun t <SubTotalVAT />
< Ship p ing M e tho d N a m e < Shipping T a x Ra te />
< Shipping Pr ice T a x Ex cl <ShippingPriceTaxIncl /> <ShippingVATAmount /> <EcoTaxAmountTaxIncl /> <PaymentFeesTaxRate /> <PaymentFeesTaxExc /> <PaymentFeesTaxInc /> <PaymentFeesVATAmount /> <CashOnDelivery /> <NetAmountDue /> <TotalWeight />
<CartCoupon /> <LogisticsServiceProviderAccess /> <LogisticsServiceProviderInstructions /> <Language />
  <SubTotalNet />
   float
   Subtotal of item rows before applying the global discount.
    />
/> />
                                    />
                                                                                    ISO- 639-1 Code Supported language values:
fr French, en English, es Spanish, de German, it Italian, nl Dutch, ca Catalan, pt Portuguese.
        <PaymentMethodName />
< Pay mentL astM odifiedDate <RemoteIPAddr /> <SalesRepCode /> <SalesRepFirstName /> <SalesRepLastName />
< Shipping Company />
/>
  <PaymentStatusCode />
    integer
    Payment Status Code.
   Constant supported values:
0 Canceled
10 Technicalerror
14 Contacting payment processor 20 Payment in progress
30 Payment refused
40 Payment confirmed
                                   <ShippingUserAddressID />
   integer
   Unique ID stored in OXATIS Customer additional shipping address table.
    <ShippingUserAddressLabel /> < Shipping T itle />
< Shipping Fir stN ame /> <ShippingLastName />
                        < Shipping A ddr e ssStr e e t/>
< Shipping A ddr e ssOthe r I nfo < Shipping Z ipCode />
< Shipping City />
< Shipping Sta te />
< Shipping Sta te N a m e /> <ShippingCountryISOC ode
/>
/>
Available only for the United States, Spain and Canada. i.e: FR France, IT Italy, GB Great Britain, ES Spain...
                                            < Shipping Countr y N ame < Shipping Phone /> <ShippingInfo /> <SpecialInstructions />
<InvoiceDate /> <InvoiceID /> <InvoiceFileName /> <InvoiceURL /> <InternalNote />
/>
                  <CurrencyCode />
   string
   Sales Order currency code.
   Supported currencies: EUR Euro, USD United States dollar, CAD Canadian dollar, , NZD New Zealand dollar, CHF Swiss franc, GBP British pound, JPY Japanese yen, XPF Pacific franc, MXN Mexican peso, CLP Chilean peso
                           < Shipping Pr oce ssor Code />
   short
   Shipping processor code.
   Shipping processor value:
10 SO Colissimo
20 Mondial Relay
30 Colis Privé
40 TNT Express Entreprise 41 TNT Express Domicile 42 TNT Express Relais Colis
  Page 36 / 57

                                                               OWS API User Guide
Version 11.30 26 June 2022
        Field
Type Length
Description
Instruction
  < Shipping Par am1 />
   string
   < Shipping Par am2 />
   string
    Shipping processor codes first parameter.
  If shipping processor value is 10, its first parameter one of the following:
DOM Livraison à Domicile
RDV Livraison surRendez-Vous
BPR Point de retrait BP Relais A2P Point de retrait A2P
CIT Point de retrait Cityssimo ACP Agence ColiPoste
CDI Centre de distribution
If shipping processor value is 20, its first parameter null.
value will be
value will be
   Shipping processor codes second parameter.
    If shipping processor value is 10, its second parameter value will depend on the shipping processor’s first parameter value.
If shipping processor value is 20,
40, 41 or 42, its second parameter value will be collection point ID.
      <FiscalCode /> <TrackingNumber /> <TrackingUrl /> <TransportName />
string string string string
10
10
30 32 200 30
Company Business Registration Number. Shipping Tracking Number.
Shipping Tracking URL.
Transport name.
                      <SourceTypeID />
    integer
    Original Sales Order Type.
   Source type ID value:
ID Name
0 Web
5 MOTO
10 Ebay
20 Amazon
30
31 Rue du Commerce
32 CDiscount
33 FNAC
34 Pixmania
35 La Redoute
36 Babyssima
37 BrandAlley
38
37 BrandAlley
39 Glamour
40 Zalando
41 Atlasformen
42 Nature et
Découvertes
43 ManoMano
44 Darty
45 MacWay
46 Outiz
47 Intermarché
48 CreaVea
49 Spartoo
50 BHV
51 Veepee
52 VidaXL
53 Alltricks
54 Retif
55 Leroy Merlin
56 Maison du
Monde
57 Truffaut
58 Conforama
59 Greenweez
61 BlackMarket
ID Name
62 But
63 BricoPrivé 64 GoSport 65 Boulanger
66 Auchan 67 Miinto
68 Blissports
69 Bricomarché fr 71 Carrefour (es)
72 Carrefour (fr)
73 Clicktofournisseur 74 Entre Chasseurs
75 Geranimo
77 Holi Deco 78 I Make
79 LA LIC
80 La Poste
81 LDLC
82 Les Alliés
83 Les Nouveaux Cavistes 84 Ma Miellerie
85 Marice Claire
86 Metro
87 MonShowroom
88 Nocibé
89 Ovega
90 Petch
91 Sedagyl
92 Sevellia
93 Showroomprive
94 Vegan-place
95 Warmango
96 Wavy
100 Facebook
200 Oxatis Mobile Store
                     Price Minister
                         Galeries Lafayette
                                                                           <SourceOrderID /> <Shipped />
< CustomFie ldT e x t1
< CustomFie ldT e x t2
< CustomFie ldT e x t3
< CustomFie ldT e x t4
< CustomFie ldN ume r ic1
< CustomFie ldN ume r ic2
< CustomFieldDate /> <CampaignTrackingID />
<LegalForm />
<TrackingNumberReturn /> <CustomerCode />
<Gift />
<GiftMessage />
string boolean string string string string float float datetime integer
string
string
string boolean string
32
100 100 100 100
40 20
32 50
250
Original Sales Order ID.
Indicates whether the order is shipped or not. 1st Custom Text Field.
2nd Custom Text Field.
3rd Custom Text Field.
4th Custom Text Field.
1st Custom Numeric Field.
2nd Custom Numeric Field.
Custom Date Field.
Marketing campaign tracking ID.
Company legal form.
Tracking number for the order return Customer code.
Sales order considered as a gift.
Gift message.
            /> /> /> />
                        /> />
                  <UserTypology />
   byte
   Defines B2B or B2C customer.
   Values:
0 B2C 1 B2B
   <NAFCode />
   string
   NAF code (French activity nomenclature issued by INSEE and called the APE Code).
                             Page 37 / 57

                                           OWS API User Guide
Version 11.30 26 June 2022
        Field
Type Length
60 40 100
20 50 50 50 50 100 2000 50 50 50 50 50 50 256 256
30
40 100
50 50 50 50 50 50 256 256
Description
Instruction
  <OrderItems> <Item>
<ItemOXID />
<ItemSKU /> <ItemSKUOriginal /> <ItemName />
<Quantity />
<GrossPrice /> <GrossAmount />
<TaxRate />
<DiscountRate />
<NetPrice />
<NetAmount />
<VATAmount /> <EcotaxValueTaxIncl /> <DiscountCoupon /> <Attribute1Name /> <Attribute1Value /> <Attribute2Name /> <Attribute2Value /> <AttributeTextName />
< A ttr ibute T e x tVa lue /> <Option1Name /> <Option1Value /> <Option2Name /> <Option2Value /> <Option3Name /> <Option3Value /> <ItemMainImageURL /> <ItemThumbnailImageURL /> <Offered />
<PackagingQty /> <PackagingName /> <LinkedTo />
<Weight />
< DimensionHeig ht /> <DimensionLength /> <DimensionWidth /> <BundledItems>
<BundledItem> <ItemOXID />
<ItemSKU />
<ItemName />
<Quantity />
<Option1Name /> <Option1Value /> <Option2Name /> <Option2Value /> <Option3Name /> <Option3Value /> <ItemMainImageURL /> <ItemThumbnailImageURL /> <Offered />
<GrossPrice /> </BundledItem>
</BundledItems> <Item>
</OrderItems > </OrderItems >
   integer string string string integer float float float float float float float float string string string string string string string string string string string string string string string boolean integer string integer
float float float float
integer string string integer string string string string string string string string boolean float
  <OrderTaxDetails> <TotalNetTaxExcl />
<TaxRate />
<TotalNetVATAmount /> </OrderTaxDetails>
   float float float
    Unique ID stored in OXATIS Product table. Item code in the shopping cart.
Original item code.
Item name.
Item quantity. Gross unit price. Gross amount.
VAT rate value. Discount rate value. Net unit price.
Net amount.
VAT amount.
Ecotax value including VAT.
Discount coupon.
First attribute value.
First attribute name.
Second attribute name.
Second attribute value.
Text attribute name.
Text Attribute value.
First option type name.
First option value name.
Second option type name.
Second option value name.
Third option type name.
Third option value name.
Item’s main image URL.
Item’s thumbnail image URL.
Indicates whether the item is offered or not.
Item packaging quantity.
Item packaging name.
This identifier represent the sales order line ID of the linked item.
Item weight.
Item Height.
Item length.
Item width.
Unique ID stored in OXATIS Product table. Bundled Item code.
Bundled Item name.
Bundled Item quantity.
Bundled Item first option name.
Bundled Item first option value.
Bundled Item second option name.
Bundled Item second option value.
Bundled Item third option name.
Bundled Item third option value.
Bundled Item main image URL.
Bundled Item thumbnail image URL.
Indicates whether the bundled item is offered or not. Bundled item gross price.
  GrossAmount = GrossPrice * Quantity
NetAmount = NetPrice * Quantity
  Net total excluding tax. Tax rate value.
Total VAT amount.
   TotalNetVATAmount = TotalNetTaxExcl * TaxRate
 L2) Order List
➢ XML Structure
<OrderList> <PageInformation>
<PageNumber /> <PageSize /> <TotalItems /> <TotalPages />
 </PageInformation> <OrderDateStart> /> <OrderDateEnd /> <PaymentStatusDateSt art
< P ay men t St at u s D at e En d <LogisticDateStart /> <LogisticDateEnd /> <PaymentStatusCode /> <SetOrderDesc/ > <OrderStatus /> <InvoiceDateStart /> <InvoiceDateEnd /> <OrdersProcessed /> <OrdersInvoiced /> <OrdersShipped /> <ShippingProcessorCode /> <OrderIDs />
<OrderID> <OxID />
</OrderID> </OrderIDs> </OrderList>
/> / >
 Page 38 / 57

                                                                           OWS API User Guide
➢ Field Definitions, Types and Values
Version 11.30 26 June 2022
       Field
<OrderDateStart />
<PaymentStatusDateStar t />
<LogisticDateStart />
<OrderStatus />
<InvoiceDateStart /> <InvoiceDateEnd />
<OrdersInvoiced />
Type     Description
Instruction
Must be greater or equal to
Must be greater or equal to
Must be greater or equal to
Constant supported values:
0 Unbilled Sales Orders
1 Invoiced Sales Orders
2 All
Must be greater or equal to Must be greater or equal to
   <PageInformation> <PageNumber /> <PageSize /> <TotalItems /> <TotalPages />
</PageInformation>
         integer integer integer integer
        The page number to request.
The page size to request.
Total items retrieved in OXATIS Order table.
Total pages are calculated according to the total items and the page size.
        Must be greater than zero. Must be greater than zero.
    datetime
datetime
datetime
integer
datetime datetime
boolean
Start date of last sales order modification.
Start date of last payment status modification.
Start date of last logistic service provider access update.
Sales order status.
Start date of last invoiced order. End date of last invoiced order.
Invoiced sales orders.
January 15, 2010.
January 15, 2010.
January 15, 2010.
January 15, 2010. January 15, 2010.
  <OrderDateEnd />
   datetime
   End date of last sales order modification.
   Must be greater or equal to January 15, 2010.
   <PaymentStatusDateEn d />
   datetime
   End date of last payment status modification.
   Must be greater or equal to January 15, 2010.
   < L og isticDateEnd />
   datetime
   End date of last logistic service provider access update.
   Must be greater or equal to January 15, 2010.
  <PaymentStatusCode />
  integer
 Payment status code.
 Constant supported values:
0 Canceled
10 Technicalerror
14 Contacting payment processor 20 Payment in progress
30 Payment refused
40 Payment confirmed
  <SetOrderDesc />
   boolean
   Sales orders are sorted in descending order.
   true default value
               <OrdersProcessed />
   boolean
   Validated sales orders.
      <OrdersShipped />
   boolean
   Shipped sales orders.
     < Shipping Pr oce ssor Code />
  integer
 Shippinng processor code.
 Shipping type code values:
ID Name
5 Store pickup
10 Colissimo
11 Colissimo Flexibility
12 Colissimo Flexibility Home
20 Mondial Relay 30 Colis Privé
40 TNT enterprise
41 TNT Particular
42 TNT Drop off point
50 DPD Drop off point
51 DPD Particular
52 DPD Office
53 DPD World
54 Shippy Pro
100 Boxtal
  <OrderIDs /> <OrderID>
<OxID /> </OrderID>
</OrderIDs>
   integer
   Unique ID stored in OXATIS sales order table.
    L3) Order Validate
➢ XML Structure
<OrderValidate> <OxID /> <ChequeNumber /> <Notes />
</OrderValidate>
 ➢ Field Definitions, Types and Values
       Field     Type
<OxId/>     integer
Length Description
Unique ID stored in OXATIS Sales Order table. 40 Cheque number.
200 Notes.
Instruction
      Must be greater than zero.
    <ChequeNumber />
<Notes />     String
String
           Page 39 / 57

                                                              L4) Order Source
➢ XML Structure
<OrderSource> <StartDate /> <EndDate /> <SourceTypeID /> <SourceOrderID /> </OrderSource>
OWS API User Guide
Version 11.30 26 June 2022
 ➢ Field Definitions, Types and Values
           Field
Type Length
datetime datetime
Description
Start period date. End period date.
Instruction
        <StartDate /> <EndDate />
       The date range cannot exceed 24h.
                <SourceTypeID />
integer
Sales order source type ID.
Predefined values :
ID Name ID
0 Web 62 5 MOTO 63 10 Ebay 64 20 Amazon 65
30 Price 66
Minister
31 Rue du 67
Commerce
32 CDiscount 68
33 FNAC 69
34 Pixmania 71
35 La Redoute 72
36 Babyssima 73
37 BrandAlley 74
38 Galeries 75
Lafayette
37 BrandAlley 77
39 Glamour 78
40 Zalando 79
41 Atlasformen 80
42 Nature et 81
Découvertes
43 ManoMano 82
44 Darty 83
45 MacWay 84
46 Outiz 85
47 Intermarché 86
48 CreaVea 87
49 Spartoo 88
50 BHV 89
51 Veepee 90
52 VidaXL 91
53 Alltricks 92
54 Retif 93
55 Leroy Merlin 94
56 Maison du 95
Monde
57 Truffaut 96
58 Conforama 100
59 Greenweez 200
61 BlackMarket
Name
But BricoPrivé GoSport Boulanger
Blissports Bricomarché fr Carrefour (es) Carrefour (fr) Clicktofournisseur Entre Chasseurs
Holi Deco I Make
LA LIC
La Poste
Les Alliés
Les Nouveaux Cavistes Ma Miellerie
Marice Claire
Metro
MonShowroom
Nocibé
Ovega
Petch
Sedagyl
Sevellia Showroomprive
Vegan- place
Wavy
Facebook
Oxatis Mobile Store
                         Auchan
     Miinto
                              Geranimo
                     LDLC
                                                        Warmango
                         <SourceOrderID />
String 32
Sales order source ID.
     L5) Sales Order Progress State (Sales Order Tracking)
➢ XML Structure
<ProgressState>
<OrderID />
<Date /> <ProgressStateMnemonicName /> <ProgressStateID />
<Publish />
<SendEmail / >
<SendSMS / >
<CreateInvoice /> <UpdateOrderProgressSt ate /> < AttachmentFileNam e /> <Attachment>
 <StrBytes /> </Attachment> <ReplaceField1>
<Name />
<Value /> </ReplaceField 1> <ReplaceField2 /> <ReplaceField3 /> <ReplaceField4 /> <ReplaceField5 /> </ProgressState>
similar to <ReplaceField1>. similar to <ReplaceField1>. similar to <ReplaceField1>. similar to <ReplaceField1>.
 Page 40 / 57

                                                                                           OWS API User Guide
➢ Field Definitions, Types and Values
Version 11.30 26 June 2022
         Field
<OrderID /> <Date />
<ProgressStateMnemonicName /> <ProgressStateID />
Type
integer datetime
string integer
boolean boolean boolean
string
string
string
string string
Length Description
Sales order ID.
Date of the new state of progress.
16 Mnemonic name of the progress state.
Progress state ID: Unique ID stored in OXATIS Progress State table.
Send an email notifying the customer of the state of progress of their sales order. Send a SMS notifying the customer of the state of progress of their sales order. Generate an invoice by the system.
50 Attachment file name.
25 Attached invoice ID.
Binary attachment content in base64 encoded string.
50 Field name to be replaced in state of progress comment. 50 Field value.
similar to <ReplaceField1>. similar to <ReplaceField1>.
< OrderItemArray > < OrderItem>
<Code />
<Name /> <ProductLanguageISO Code /> <Quantity /> <UnitPriceVATIncluded /> <UnitPriceVATExcluded /> <TaxRate />
<DiscountRate /> <EcoTaxValueTaxI ncluded /> <UpdateStock />
<Weight />
<DimensionHeight /> <DimensionLength /> <DimensionWidth />
</OrderItem> </OrderItemArr ay>
</OrderAdd >
                          <Publish />
   boolean
      Publish the state of progress for the customer.
 <SendEmail /> <SendSMS /> <CreateInvoice />
< A tta chm e ntFile N a m e
<InvoiceID />
<Invoice />
<ReplaceField1> <Name /> <Value />
</ReplaceField1> <ReplaceField3 />
<ReplaceField5 />
/>
              <UpdateOrderProgressState />
   boolean
      Update the state of progress of the sales order.
   <Attachment />
   string
      Binary attachment content in base64 encoded string.
   <InvoiceFileName />
   string
   50
   Attached invoice file name.
   <InvoiceDate />
   datetime
      Invoice date.
   <ReplaceField2 />
         similar to <ReplaceField1>.
   <ReplaceField4 />
         similar to <ReplaceField1>.
     L6) Order Add
➢ XML Structure
<OrderAdd>
<Email />
<Date /> <SourceOrderId /> <BillingContact>
<Phone /> <Title /> <FirstName /> <LastName /> <Address>
<Street /> <OtherInfo />
<City /> <CountryISOCode /> <State />
<ZipCode /> </Address>
</BillingContact> <ShippingContact>
<Phone /> <Title /> <FirstName /> <LastName /> <Company /> <Address />
<Street /> <OtherInfo />
<City /> <CountryISOCode /> <State />
<ZipCode /> </Address>
</ShippingContact> <CellPhone />
<Fax />
<VATNumber /> <FiscalCode /> <GlobalDiscountRate /> <ShippingInfo />
< ShippingMethodNam e /> <ShippingPriceVATIncluded /> <ShippingPriceVATExclud ed /> <ShippingTaxRate />
<SpecialInstructions />
<PaymentTypeID />
< PaymentMethodNam e /> <PaymentFeesVATInclu ded /> <PaymentFeesVATExclud ed /> <PaymentFeesTaxRat e /> <OrderStatusCode />
<LanguageISOCod e /> <ComputeOrderInVATExclu ded Mod e /> <AddEcoTaxToPrice /> <GrandTotalVATIncluded /> <ApplyLoyaltyProgram /> <CurrencyISOCode />
<UserTypology />
<LegalForm />
<NAFCode />
  Page 41 / 57

                                                                                                      OWS API User Guide
➢ Field Definitions, Types and Values
Version 11.30 26 June 2022
         Field
<Email />
<Date /> <SourceOrderId />
Type Length
Description
Contact email.
Sales order date.
Sales order source ID.
Instructions
        string datetime string
255 32
                      <SourceTypeId />
integer
Sales order source type ID.
Predefined values :
ID Name
0 Web
5 MOTO
10 Ebay
20 Amazon
30
31 Rue du Commerce
32 CDiscount
33 FNAC
34 Pixmania
35 La Redoute
36 Babyssima
37 BrandAlley
38
37 BrandAlley
39 Glamour
40 Zalando
41 Atlasformen
42 Nature et
Découvertes
43 ManoMano
44 Darty
45 MacWay
46 Outiz
47 Intermarché
48 CreaVea
49 Spartoo
50 BHV
51 Veepee
52 VidaXL
53 Alltricks
54 Retif
55 Leroy Merlin
56 Maison du
Monde
57 Truffaut
58 Conforama
59 Greenweez
61 BlackMarket
ID Name
62 But
63 BricoPrivé 64 GoSport 65 Boulanger
66 Auchan 67 Miinto
68 Blissports
69 Bricomarché fr 71 Carrefour (es)
72 Carrefour (fr)
73 Clicktofournisseur 74 Entre Chasseurs
75 Geranimo
77 Holi Deco 78 I Make
79 LA LIC
80 La Poste
81 LDLC
82 Les Alliés
83 Les Nouveaux Cavistes 84 Ma Miellerie
85 Marice Claire
86 Metro
87 MonShowroom
88 Nocibé
89 Ovega
90 Petch
91 Sedagyl
92 Sevellia
93 Showroomprive
94 Vegan-place
95 Warmango
96 Wavy
100 Facebook
200 Oxatis Mobile Store
                     Price Minister
                           Galeries Lafayette
                                                                                       < Billing Contact> <Phone />
<Title /> <FirstName /> <LastName /> <Company /> <Address>
<Street /> <OtherInfo />
<City />
<ZipCode />
<State /> <CountryISOCode />
</Address> </BillingContac t >
string string string string string
string string string string string string
30 30 30 50 50
50 50 30 20 2
Telephone number. Contact title. Contact first name. Contact last name. Company name
Street name and number. Locality, other information. City/Town.
Postcode.
State/County.
Country ISO 3166-2 Code.
i.e: FR France, IT Italy, GB Great Britain, ES Spain...
    < Shipping Contact / <CellPhone /> <Fax /> <VATNumber /> <FiscalCode> <LegalForm> <NAFCode>
>
similar to <BillingContact>. Mobile phone number.
Fax.
Company VAT number. Business registration number. Company legal form.
NAF code (French activity nomenclature issued by INSEE and called the APE Code).
Global discount rate.
Shipping information.
Shipping mode.
Shipping price VAT included. Shipping price VAT excluded. Shipping Tax rate.
Special instructions. Payment Type ID.
Payment method name. Payment Fees VAT included. Payment Fees VAT excluded. Payment Fees tax rate.
Sales order language.
Add eco-tax to the price.
Source Order Grand Total included VAT.
If the loyalty program is activated, it will calculate the number of loyalty points awarded.
                                            <GlobalDiscountRate /> <ShippingInfo />
< Ship p ing M e tho d N a m e
< Shipping Pr ice VA T I nclude d <ShippingPriceVATExclude d/> < Shipping T a x Ra te /> <SpecialInstructions /> <PaymentTypeID/> <PaymentMethodName /> <PaymentFeesVATIncluded /> <PaymentFeesVATExcluded/> <PaymentFeesTaxRate />
<LanguageISOCode />
<AddEcoTaxToPrice />
<GrandTotalVATIncluded /> <ApplyLoyaltyProgram />
string string string string string string
double string string double double double string Integer string double double double
string
boolean
double boolean
30 30 16 30 30 20
250 100
4kb 100
2
3
Value between 0 and 100.
Value between 1 and 999999. Value between 1 and 999999.
Value between 1 and 999999. Value between 1 and 999999.
            />
    />
                                                  <OrderStatusCode />
   integer
   Sales order status payment code.
   Constant supported values:
20 Payment in progress 40 Payment confirmed
 ISO- 639-1 Code Supported language values:
fr French, en English, es Spanish, de German, it Italian, nl Dutch, ca Catalan, pt Portuguese.
true adding eco-tax to price false default value
This value is optional.
This value is optional.
  <ComputeOrderInVATExcludedMode/>
   boolean
   If needed, the sales order can be computed in VAT excluded mode.
   true Computing sales order in VAT excluded mode false default value
               <CurrencyISOCode />
   string
   Source Order Currency ISO Code.
   This value is required.
Supported currencies: EUR Euro, USD United States dollar, CAD Canadian dollar, , NZD New Zealand dollar, CHF Swiss franc, GBP British pound, JPY Japanese yen, XPF Pacific franc, MXN Mexican peso, CLP Chilean peso
  Page 42 / 57

                                    OWS API User Guide
Description
Version 11.30 26 June 2022
        Field Type
Length
40 2
200
Instructions
  <OrderItemArray > <OrderItem> <Code />
<ProductLanguageISOCode />
<Name />
<Quantity />
< UnitPr ice VA T I nclude d />
< UnitPr ice VA T Ex clude d /> <TaxRate />
<DiscountRate /> <EcoTaxValueVATIncluded /> <UpdateStock />
<Weight />
< DimensionHeig ht /> <DimensionLength /> <DimensionWidth />
</OrderItem> </OrderItemArray>
    string string
string integer double double double double double boolean integer integer integer integer
   Product code.
Product Language ISO Code.
Product name.
Quantity.
Product unit price VAT included. Product unit price VAT excluded. Product VAT rate.
Discount rate.
Ecotax value VAT included. Updating the stock.
Item weight.
Item height.
Item length.
Item width.
   ISO- 639-1 Code Supported language values:
fr French, en English, es Spanish, de German, it Italian, nl Dutch, ca Catalan, pt Portuguese.
Value between 1 and 99999. Must be positive value.
Must be positive value.
Value between 0 and 100.
Value between 1 and 999999.
null value or true updates the item stock.
 L7)
Order API Methods
 OrderAdd
Adds a new order in OXATIS Sales Orders table.
OrderCount
Returns number of records for an interval of dates.
OrderGet
Returns all data in sales order record without items lines detail.
OrderGetBySourceID
Returns all data in sales order record belonging to an external Source ID.
OrderGetDetails
Returns all data in sales order record with all items lines.
OrderGetList
ReturnsapagniatedlistofsalesordersOxIDforaninterval of dates.
OrderGetManuallyConfirmed
Returns a list of sales orders OxID confirmed or validated manually for an interval of dates.
OrderGetMoreDetails
Returns all data in sales order record with all detailed items lines.
OrderGetSummaryList
Returns a pagniated list sales orders with a minimum of information.
OrderRequestPayment
Updates an sales order created via the web service “OrderAdd” and notifies the customer with the payment link. OrderUpdateLogisticsServiceProvider
Updates logistics information for an existing sales order. OrderUpdateTracking
Creates a state of progress related to an existing sales order.
OrderUpdateTransportInfo
Updates tracking number and tracking URL for an existing sales order.
OrderUpdateValidation
Validates a sales order settled by check or wire transfer..
L8)
Management Rules for Sales Orders
❖ Getting sales orders:
Only Sales Orders dating from January 15, 2010 can be handled by web services.
❖ Adding sales orders:
o The Sales Order must contain at least one item and cannot include more than 50 lines.
o The Sales Order date cannot be more than one year old and cannot be a date in the future. o If the contact email for the Sales Order doesn’t exist, a new customer will be created in the
database of the Oxatis site. Otherwise, the Sales Order will be associated to the customer
attached to the same email address.
o Only the VAT rates present in the admin console are authorized.
o Sales Order products or items must exist on Oxatis website, otherwise the order cannot be
added.
o By default, Sales Orders are calculated in VAT included mode. However, you can change the
mode to VAT excluded by changing the “ComputeOrderInVATExcludedMode” setting to t rue.
In this case, you need to enter the unit price in Ex VAT for each product and not in Inc VAT. o If the “PaymentConfirmed” value is set to true, the stock will be updated for each single
ordered product.
o If Sales Order includes payment fees, it is necessary to reference the Payment Type ID.
❖ Request a payment:
This operation is valid only when a Sales Order is created through the “OrderAdd” web service without any payment and having the OrderStatutsCode value “14: Contacting payment processor”.
In this case, calling the “OrderRequestPayment” web service will update the Sales Order with a new OrderStatusCode value: “20: Payment in progress” and notify the customer with the payment link.
❖ Validating a sales order:
This operation is valid only when a Sales Order is settled by check or wire transfer.
   Page 43 / 57

                                                              M. QUOTATIONS
M1) Quotation
➢ XML Structure
OWS API User Guide
Version 11.30 26 June 2022
   <Quotation> <OxID /> <Date />
<UserEmail />
<UserOxID/>
<BillingTitle /> <BillingCompany /> <BillingFirstName /> <BillingLastName /> <BillingAddressStreet /> <BillingAddressOtherInfo /> <BillingZipCode /> <BillingCity />
<BillingState /> <BillingCountryISOCode /> <BillingCountryName /> <BillingPhone /> <BillingCellPhone /> <BillingFax /> <CompanyVATNumber /> <VATIncluded /> <EcoTaxIncluded /> <SubTotalNet /> <SubTotalNetDiscounted /> <GlobalDiscountRate /> <GlobalDiscountAmount /> <SubTotalVAT /> <ShippingMethodName
<QuotationItems> <ItemOXID />
<ItemSKU /> <ItemSKUOriginal /> <ItemName /> <Quantity /> <GrossPrice /> <LineGrossAmount /> <TaxRate /> <DiscountRate /> <NetPrice /> <LineNetAmount /> <LineVATAmount /> <EcoTaxPriceTaxIncl /> <DiscountCoupon /> <Attribute1Name /> <Attribute1Value /> <Attribute2Name /> <Attribute2Value /> <AttributeTextName /> <AttributeTextValue />
<Option1Name /> <Option1Value /> <Option2Name /> <Option2Value /> <Option3Name /> <Option3Value /> <ItemMainImageU RL />
< ItemThumbnailIma g eURL /> <Offered />
<PackagingQty/> <PackagingName/> <LinkedTo/> <Weight/> <DimensionHeight/> <DimensionLength/> <DimensionWidth/> < BundledItems>
< BundledItem>
<ItemOXID />
<ItemSKU />
<ItemName />
<Quantity />
<Option1Name /> <Option1Value />
< Option2 Name/> <Option2Value /> <Option3Name /> <Option3Value /> <ItemMainImageUR L /> <ItemThumbnailImageU RL /> <Offered />
</BundledItem> </BundledItems>
/QuotationItems> <QuotationTaxDetails>
<TotalNetTaxExcl /> <TaxRate /> <TotalNetVATAmount />
</QuotationTaxDetails> </Quotation>
                           />
< ShippingTaxRate /> <ShippingPriceTaxExcl /> <ShippingPriceTaxIncl /> <ShppingVATAmount /> <EcoTaxAmountTaxIncl />
<PaymentFeesTaxR at e <PaymentFeesTax Exc <PaymentFeesTax Inc <PaymentFeesVATA mount <CashOnDelivery/> <NetAmountDue /> <TotalWeight /> <CartCoupon /> <Language /> <RemoteIPAddr /> <SalesRepCode /> <SalesRepFirstName />
      /> />
  />
 />
         < SalesRepLastNam e /> <ShippingCompany /> <ShippingTitle /> <ShippingFirstName /> <ShippingLastName /> <ShippingAddress /> <ShippingAddressStreet/> <ShippingAddressOtherInfo /> <ShippingZipCode /> <ShippingCity /> <ShippingState /> <ShippingCountryISOCode /> <ShippingCountryName /> <ShippingPhone /> <ShippingInfo /> <SpecialInstructions /> <CurrencyCode /> <InternalNote /> <ShippingProcessorCode /> <ShippingParam1 /> <ShippingParam2 /> <FiscalCode /> <TrackingNumber /> <TrackingUrl /> <TransportName />
<SourceTypeID /> <SourceOrderID /> <Shipped /> <CustomFieldText1 /> <CustomFieldText2 /> <CustomFieldText3 /> <CustomFieldText4 /> <CustomFieldNumeric1 /> <CustomFieldNumeric2 /> <CustomFieldDate /> <UserTypology /> <LegalForm />
<NAFCode /> <CustomerCode />
                                       Page 44 / 57

                                                                                                         OWS API User Guide
➢ Field Definitions, Types and Values
Version 11.30 26 June 2022
           Field
<OxId/> <Date />
Type Length
Description
Unique ID stored in OXATIS Quotation table. Quotation date.
Contact email.
Unique ID stored in OXATIS Customer table. Contact title (Billing address).
Company name (Billing address).
Contact first name (Billing address).
Contact last name (Billing address).
Street name and number (Billing address). Locality, other information (Billing address). Postal code (Billing address).
City name (Billing address).
State (Billing address).
State name (Billing address).
Country ISO 3166-2 Code (Billing address). Country name (Billing address).
Telephone (Billing address).
Mobile (Billing address).
Fax (Billing address).
Company VAT Number.
Indicates whether the ecotax is included or not in the item price.
Global discount rate.
Global discount amount.
VAT subtotal.
Shipping method name.
Shipping VAT rate.
Shipping price excluding VAT.
Shipping price including VAT.
Shipping VAT amount.
Ecotax amount including VAT.
Payment fees VAT rate.
Payment fees excluding VAT.
Payment fees including VAT.
Payment fees VAT amount.
Cash on delivery.
Shopping cart net amount due.
Total weight.
Special offer code (discount coupon). Logistics service provider last access date. Logistics service provider instructions.
Remote IP address.
Sales representative code.
Sales representative first name. Sales representative last name. Company name (Shipping address).
Shipping address label.
Contact title (Shipping address).
Contact first name (Shipping address).
Contact last name (Shipping address).
Street name and number (Shipping address). Locality, other information (Shipping address). Postal code (Shipping address).
City name (Shipping address).
State (Shipping address).
State name (Shipping address).
Country ISO 3166-2 Code (Shipping address). Country name (Shipping address).
Telephone (Shipping address).
Shipping information.
Special instructions.
Internal note.
Instruction
Must be greater than zero. ISO 8601 format
          integer datetime
string integer string string string string string string string string string string string string string string string string
boolean
float float float string float float float float float float float float float Boolean float integer string datetime string
string string string string string
string string string string string string string string string string string string string string string
string
(YYYY-MM-DDThh:mm:ss )
is used for Datetime.
               <UserEmail /> <UserOxID/>
< Billing T itle />
< Billing Company
< Billing Fir stN ame <BillingLastName />
< Billing A ddr e ssStr e e t
< Billing A ddr e ssOthe r I nfo < Billing Z ipCode />
< Billing City />
< Billing Sta te />
< Billing Sta te N a m e />
< Billing Countr y I SO Code
255
30 50 30 50 50 50 20 50 30 50 2 50 30 30 30 50
100
20 100
50 10 30 50 50
64 30 30 50 50 50 20 50 30 50 2 50 30 255 4kb
250
                    /> />
                         />
     />
/>
Available only for the United States, Spain and Canada. i.e: FR France, IT Italy, GB Great Britain, ES Spain...
                                             < Billing Countr y N ame < Billing Phone />
/>
               < Billing Ce llPhone <BillingFax /> <CompanyVATNumber />
/>
                  <VATIncluded /> boolean
       Computing mode: including or excluding VAT.
   true Including VAT false default value
 <EcoTaxIncluded />
<GlobalDiscountRate /> <GlobalDiscountAmoun t <SubTotalVAT />
< Ship p ing M e tho d N a m e < Shipping T a x Ra te />
< Shipping Pr ice T a x Ex cl <ShippingPriceTaxIncl /> <ShippingVATAmount /> <EcoTaxAmountTaxIncl /> <PaymentFeesTaxRate /> <PaymentFeesTaxExc /> <PaymentFeesTaxInc /> <PaymentFeesVATAmount /> <CashOnDelivery /> <NetAmountDue /> <TotalWeight />
<CartCoupon /> <LogisticsServiceProviderAccess /> <LogisticsServiceProviderInstructions />
<RemoteIPAddr /> <SalesRepCode /> <SalesRepFirstName /> <SalesRepLastName /> < Shipping Company />
<ShippingUserAddressLabel /> < Shipping T itle />
< Shipping Fir stN ame /> <ShippingLastName />
   <SubTotalNetDiscounte d /> float
       Subtotal of shopping cart after applying the global discount.
              /> />
                              />
                                                                                                  <Language /> string
    2
   Quotation language.
   ISO- 639-1 Code Supported language values:
fr French, en English, es Spanish, de German, it Italian, nl Dutch, ca Catalan, pt Portuguese.
                                  <ShippingUserAddressID /> integer
       Unique ID stored in OXATIS Customer additional shipping address table.
                                  < Shipping A ddr e ssStr e e t/>
< Shipping A ddr e ssOthe r I nfo < Shipping Z ipCode />
< Shipping City />
< Shipping Sta te />
< Shipping Sta te N a m e /> <ShippingCountryISOC ode
/>
/>
Available only for the United States, Spain and Canada.
                                                       < Shipping Countr y N ame < Shipping Phone /> <ShippingInfo /> <SpecialInstructions />
<InternalNote />
/>
                       <CurrencyCode /> string
    3
   Quotation currency code.
   Supported currencies: EUR Euro, USD United States dollar, CAD Canadian dollar, , NZD New Zealand dollar, CHF Swiss franc, GBP British pound, JPY Japanese yen, XPF Pacific franc, MXN Mexican peso, CLP Chilean peso
    < Shipping Pr ocessor Code /> short
      Shipping processor code.
   Shipping processor value:
10 SO Colissimo 20 Mondial Relay 30 Colis Privé
  <ShippingParam1 />
  string
   10
 Shipping processor codes’s first parameter
 If shipping processor value is 10, its first parameter value will be one of the following:
DOM Livraison à Domicile
RDV Livraison surRendez-Vous
BPR Point de retrait BP Relais A2P Point de retrait A2P
CIT Point de retrait Cityssimo ACP Agence ColiPoste
CDI Centre de distribution
If shipping processor value is 20, its first parameter value will be null.
  <ShippingParam2 /> string
    10
   Shipping processor codes’s second parameter
   If shipping processor value is 10, its second parameter value will depend on the shipping processor’s first parameter value.
If shipping processor value is 20, its second parameter value will be collection point ID.
 <FiscalCode />
string
30
Company Business Registration Number .
      Page 45 / 57

                                 OWS API User Guide
Type Length Description
string 100 1st Custom Text Field. string 100 2nd Custom Text Field. string 100 3rd Custom Text Field. string 100 4th Custom Text Field.
float 1st Custom Numeric Field.
float 2nd Custom Numeric Field. datetime Custom Date Field.
byte Defines B2B or B2C customer.
string 40 Company legal form.
Version 11.30 26 June 2022
     Field
<CustomFieldText1 /> <CustomFieldText2 /> <CustomFieldText3 /> <CustomFieldText4 /> <CustomFieldNumeric1 /> <CustomFieldNumeric2 /> <CustomFieldDate />
<UserTypology />
<LegalForm /> <NAFCode /> <CustomerCode />
Instruction
Values:
0 B2C 1 B2B
                                                                                string 20
string 50 Customer code.
NAF code (French activity nomenclature issued by
INSEE and called the APE Code).
            <QuotationItems> <ItemOXID />
<ItemSKU /> <ItemSKUOriginal /> <ItemName />
<Quantity />
<GrossPrice /> <GrossAmount />
<TaxRate />
<DiscountRate />
<NetPrice />
<NetAmount />
<VATAmount /> <EcotaxValueTaxIncl /> <DiscountCoupon /> <Attribute1Name /> <Attribute1Value /> <Attribute2Name /> <Attribute2Value /> <AttributeTextName />
< A ttr ibute T e x tVa lue /> <Option1Name /> <Option1Value /> <Option2Name /> <Option2Value /> <Option3Name /> <Option3Value /> <ItemMainImageURL /> <ItemThumbnailImageURL /> <Offered />
<PackagingQty /> <PackagingName /> <LinkedTo />
<Weight /> <DimensionHeight /> <DimensionLength /> < DimensionWidth /> <BundledItems>
<BundledItem> <ItemOXID />
<ItemSKU />
<ItemName />
<Quantity />
<Option1Name /> <Option1Value /> <Option2Name /> <Option2Value /> <Option3Name /> <Option3Value /> <ItemMainImageURL /> <ItemThumbnailImageURL /> <Offered />
</BundledItem> </BundledItems>
</QuotationItems >
  integer string string string integer float float float float float float float float string string string string string string string string string string string string string string string boolean integer string integer
float float float float
integer string string integer string string string string string string string string boolean
   60 40 100
20 50 50 50 50 100 2000 50 50 50 50 50 50 256 256
30
40 100
50 50 50 50 50 50 256 256
  Unique ID stored in OXATIS Product table. Item code in the shopping cart.
Original item code.
Item name.
Item quantity. Gross unit price. Gross amount.
VAT rate value. Discount rate value. Net unit price.
Net amount.
VAT amount.
Ecotax value including VAT.
Discount coupon.
First attribute value.
First attribute name.
Second attribute name.
Second attribute value.
Text attribute name.
Text Attribute value.
First option type name.
First option value name.
Second option type name.
Second option value name.
Third option type name.
Third option value name.
Item’s main image URL.
Item’s thumbnail image URL.
Indicates whether the item is offered or not.
Item packaging quantity.
Item packaging name.
This identifier represent the sales order line ID of the linked item.
Item weight.
Item Height.
Item length.
Item width.
Unique ID stored in OXATIS Product table. Bundled Item code.
Bundled Item name.
Bundled Item quantity.
Bundled Item first option name.
Bundled Item first option value.
Bundled Item second option name.
Bundled Item second option value.
Bundled Item third option name.
Bundled Item third option value.
Bundled Item main image URL.
Bundled Item thumbnail image URL.
Indicates whether the bundled item is offered or not.
  GrossAmount = GrossPrice * Quantity
NetAmount = NetPrice * Quantity
   <QuotationTaxDetails> <TotalNetTaxExcl />
<TaxRate />
<TotalNetVATAmount /> </ QuotationTaxDetails >
float float float
       Net total excluding tax. Tax rate value.
Total VAT amount.
   TotalNetVATAmount = TotalNetTaxExcl * TaxRate
 M2) Quotation List
➢ XML Structure
<QuotationList> <PageInformation>
<PageNumber /> <PageSize /> <TotalItems /> <TotalPages />
</PageInformation> <StartDate> /> <EndDate /> <SetOrderDesc> /> <QuotationIDs />
<QuotationID> <OxID /> </QuotationID>
</QuotationIDs> </QuotationList>
  Page 46 / 57

 OWS API User Guide
➢ Field Definitions, Types and Values
Version 11.30 26 June 2022
       Field     Type
Description
Start date of last quotation modification.
Quotations are sorted in descending order.
Instruction
Must be greater or equal to January 1, 2013.
true default value
   <PageInformation> <PageNumber /> <PageSize /> <TotalItems /> <TotalPages />
</PageInformation>
         integer integer integer integer
        The page number to request.
The page size to request.
Total items retrieved in OXATIS Quotation table.
Total pages are calculated according to the total items and the page size.
        Must be greater than zero. Must be greater than zero.
    <StartDate />
<SetOrderDesc />
datetime
boolean
  <EndDate />
   datetime
   End date of last quotation modification.
   Must be greater or equal to January 1, 2013.
    <QuotationIDs /> <QuotationID>
<OxID /> </QuotationID>
</QuotationIDs>
          integer
      Unique ID stored in OXATIS quotation table.
     M3) Quotation API Methods
 QuotationCount
Returns number of records for an interval of dates.
QuotationDelete
Deletes definetively a quotation.
QuotationGet
Returns all data in quotation record without items lines detail.
QuotationGetDetails
Returns all data in quotation record with all items lines.
QuotationGetList
Returns a paginated list of quotations OxID for an interval of dates.
QuotationGetMoreDetails
Returns all data in quotation record with all items lines including images URL items.
QuotationGetSummaryList
Returns a list quotations with a minimum of information.
 Page 47 / 57

 OWS API User Guide
N. SALES REPRESENTATIVE
N1) Sales Representative
➢ XML Structure
➢ Field Definitions, Types and Values
Field Type Length Description Instructions
Version 11.30 26 June 2022
   <SalesRep> <OxID /> <Code /> <Email /> <FirstName /> <LastName /> </SalesRep>
                      <OxId />     integer       Unique ID stored in OXATIS Sales representative table. <Code /> string 10 Unique Sales representative code.
<Email /> string 255 Unique Sales representative email.
<FirstName /> string 30 Sales representative first name.
<LastName /> string 50 Sales representative last name.
N2) Sales Representative List
➢ XML Structure
➢ Field Definitions, Types and Values
Must be greater than zero.
Must be a valid formatted email address.
                                      <SalesRepList> <SalesRepsID> <SalesRepID>
<OxID /> <Code /> <Email />
</SalesRepID> </SalesRepsID> </SalesRepList>
               Field     Type Length
Description
Unique ID stored in OXATIS Sales representative table. Unique Sales representative code.
Unique Sales representative email.
        <OxId /> <Code /> <Email />
integer
string 10 string 255
                N3) Sales Representative API Methods
N4) Management Rules for Sales Representative
 SalesRepGet
Returns all data in sales representative record.
SalesRepGetList
Returns a list of all sales representative OxID.
SalesRepDelete
Deletes definetively a sales representative.
 SalesRepAdd
Adds a sales representative in OXATIS Sales Representative table.
SalesRepImport
Adds or Updates a sales representative in OXATIS Sales Representative table.
SalesRepUpdate
Updates an existing sales representative.
❖ To create or insert a new sales representative, you must define a unique valid email address and a unique code (Do not initialize “OxID” in this current context).
❖ “OxID” might be used in Get or Updates methods to identify sales representative records in the OXATIS sales representative table.
❖ To delete an existing sales representative, you might use either “OxID”, “Email” or “Code”.
  Page 48 / 57

                                                O. SHIPPING TYPES
O1) Shipping Type
➢ XML Structure
OWS API User Guide
Version 11.30 26 June 2022
   <ShippingType> <Name />
<PriceVATExcluded /> <WeightVolumeEquiv alent <PercentageOrValu eToAdd <LanguageISOCod e /> <Type />
<AmountMin /> <AmountMax /> <DateBegin />
<DateEnd />
<Description /> <ImgFileName /> <SalesOrderWeight Max /> <SalesOrderWeight Min /> <PayCOD /> <ApplyOnWebSite /> <ApplyOnMobileSite /> <ApplyOnMOTO /> <ApplyOnPrice1 /> <ApplyOnPrice2 /> <ApplyOnPrice3 /> <ApplyOnPrice4 /> <ApplyOnPrice5 /> <ApplyOnPrice6 /> <ApplyOnPrice7 /> <ApplyOnPrice8 /> <ApplyOnPrice9 /> <ApplyOnPrice10 /> <State />
<Position /> <TaxClass> <OxID />
<Name />
</TaxClass>
<TaxRate /> <TaxCountryISOCode /> <TransportName /> <TransportType /> <UserAssociatedCategor y> <OxID />
<Name /> </UserAssociatedCategory> <UserCategoryExcluded>
<OxID />
/> />
<UpRange17 /> <Price17VATExcluded /> <UpRange18 /> <Price18VATExcluded /> <UpRange19 /> <Price19VATExcluded /> <UpRange20 /> <Price20VATExcluded /> <UpRange21 /> <Price21VATExcluded /> <UpRange22 /> <Price22VATExcluded /> <UpRange23 /> <Price23VATExcluded /> <UpRange24 /> <Price24VATExcluded /> <UpRange25 /> <Price25VATExcluded /> <UpRange26 /> <Price26VATExcluded /> <UpRange27 /> <Price27VATExcluded /> <UpRange28 /> <Price28VATExcluded /> <UpRange29 /> <Price29VATExcluded /> <UpRange30 /> <Price30VATExcluded /> <UpRange31 /> <Price31VATExcluded /> <UpRange32 /> <Price32VATExcluded /> <UpRange33 /> <Price33VATExcluded /> <UpRange34 /> <Price34VATExcluded /> <UpRange35 /> <Price35VATExcluded /> <UpRange36 /> <Price36VATExcluded /> <GeoZone /> <CountryArray>
<Country> <Code /> </Country>
</CountryArray> </ShippingType>
                                             <Name />
</UserCategoryExclud ed>
<ZipCodeFilter />
<Comment />
<StrictLevel />
<StartRange />
<UpRange1 />
<Amount1 />
<UpRange2 />
<Price2VATExcluded />
<UpRange3 />
<Price3VATExcluded />
<UpRange4 />
<Price4VATExcluded />
<UpRange5 />
<Price5VATExcluded />
<UpRange6 />
<Price6VATExcluded />
<UpRange7 />
<Price7VATExcluded />
<UpRange8 />
<Price8VATExcluded />
<UpRange9 />
<Price9VATExcluded />
<UpRange10 />
<Price10VATExcluded />
<UpRange11 />
<Price11VATExcluded />
<UpRange12 />
<Price12VATExcluded />
<UpRange13 />
<Price13VATExcluded />
<UpRange14 />
<Price14VATExcluded />
<UpRange15 />
<Price15VATExcluded />
<UpRange16 /> <Price16VATExcluded>0</Price16VATExclud ed>
                                      Page 49 / 57

                                                                                                                                                     ➢ Field Definitions, Types and Values
OWS API User Guide
Version 11.30 26 June 2022
           Field
<OxId />
<Name /> <PriceVATExcluded /> <WeightVolumeEquivalen t
/>
Type
integer string float float
float string
float float datetime datetime String
float float boolean boolean boolean boolean boolean boolean boolean boolean boolean boolean boolean boolean boolean boolean boolean
integer
integer
string
String float
string
integer
string
string
integer
string
string string boolean float float float float float float float float float float float float float float float float float float float float float float float
Length
100
2
Description
Unique ID stored in OXATIS Shipping type table. Shipping type name.
Shipping price VAT excluded.
Weight/Volume equivalent.
ValueorPercentage toadd. Shipping type language.
Minimum total order amount. Maximum total order amount. Begin of validity period.
End of validity period. Shipping type description.
Minimum total order weight.
Maximum total order weight.
Cash on delivery.
Shipping type interface available for website. Shipping type interface available for mobile site. Shipping type interface available for MOTO. Shipping option applies to price 1.
Instructions
Must be greater than zero.
Only for the formula type:
                                        <PercentageOrValueToAdd /> <LanguageISOCode />
<AmountMin /> <AmountMax /> <DateBegin /> <DateEnd /> <Description />
<SalesOrderWeightMax /> <SalesOrderWeightMax /> <PayCOD />
< A pply OnW e bSite />
ProportionnalOnOrderWeightVolume
and
StepsOnOrderWeightVolume
ISO- 639-1 Code Supported language values:
fr French, en English, es Spanish, de German, it Italian, nl Dutch, ca Catalan, pt Portuguese.
       <FormulaType />
    enum
           Shipping calculation type.
    Values: FixedPrice, ProportionnalOnOrderIt emNu mber, ProportionnalOnOrderA mount, ProportionnalOnOrderWeightVolume, StepsOnOrderNumb erItems, StepsOnOrderAmountVATExcluded, StepsOnOrderAmountVA TIncl uded or StepsOnOrderWeightVolume
                                            <ImgFileName /> string
    100
   Image file name.
   The file name must exist in the “Image Gallery”.
                               < A pply OnM obile Site <ApplyOnMOTO /> <ApplyOnPrice1 /> <ApplyOnPrice2 /> <ApplyOnPrice3 /> <ApplyOnPrice4 /> <ApplyOnPrice5 /> <ApplyOnPrice6 /> <ApplyOnPrice7 /> <ApplyOnPrice8 /> <ApplyOnPrice9 /> <ApplyOnPrice10 /> <State />
<Position /> <TaxClass> <OxID />
<Name /> </ TaxClass > <Name /> <TaxRate />
<TransportName />
/>
                         Shipping
Shipping
Shipping
Shipping
Shipping
Shipping
Shipping
Shipping
Shipping option applies to price 10. Element visibility and work progress
Shipping type item position. Tax class.
Shipping type name. VAT Rate.
Transport name.
Associated customer category.
Shipping type name. Excluded customer category.
Validity by postcode. Task comment.
Tier definition is strict. Starting value.
1th tier
1th Price VAT excluded 2nd tier
2nd Price VAT excluded 3rd tier
3rd Price VAT excluded 4th tier
4th Price VAT excluded 5th tier
5th Price VAT excluded 6th tier
6th Price VAT excluded 7th tier
7th Price VAT excluded 8th tier
8th Price VAT excluded 9th tier
9th Price VAT excluded 10th tier
10th Price VAT excluded 11th tier
11th Price VAT excluded
option option option option option option option option
applies applies applies applies applies applies applies applies
to price to price to price to price to price to price to price to price
2 . 3 . 4 . 5 . 6 . 7 . 8 . 9 .
                                                                 integer
Unique ID stored in OXATIS product tax class table. Product tax class name.
100
30
Unique ID stored in OXATIS customer category table. Customer category name.
100
Unique ID stored in OXATIS customer category table. Customer category name.
50
Accepted values:
1 Publish - Element complete
2 Publish in preview
3 Hide - Element complete - Wait before publishing
                                 <TaxCountryISOCode/> string
    2
   Country related to tax rate.
   i.e: FR France, IT Italy, GB Great Britain, ES Spain...
    <TransportType /> enum
       Transport type.
   Values: None, ClickAndCollect, CollectionPoint, PickupPoint or Carrier
 <UserAssociatedCategory> <OxID />
<Name /> </UserAssociatedCategory> <Name /> <UserCategoryExcluded>
<OxID />
<Name /> </UserCategoryExcluded> <ZipCodeFilter /> <Comment /> <StrictLevel /> <StartRange /> <UpRange1 /> <Price1VATExcluded /> <UpRange2 /> <Price2VATExcluded /> <UpRange3 /> <Price3VATExcluded /> <UpRange4 /> <Price4VATExcluded /> <UpRange5 /> <Price5VATExcluded /> <UpRange6 /> <Price6VATExcluded /> <UpRange7 /> <Price7VATExcluded /> <UpRange8 /> <Price8VATExcluded /> <UpRange9 /> <Price9VATExcluded /> <UpRange10 /> <Price10VATExcluded /> <UpRange11 /> <Price11VATExcluded />
                                                                                                                                                                                                                        Page 50 / 57

                                                                                                                                  OWS API User Guide
Version 11.30 26 June 2022
          <UpRange12 /> <Price12VATExcluded /> <UpRange13 /> <Price13VATExcluded /> <UpRange14 /> <Price14VATExcluded /> <UpRange15 /> <Price15VATExcluded /> <UpRange16 /> <Price16VATExcluded /> <UpRange17 /> <Price17VATExcluded /> <UpRange18 /> <Price18VATExcluded /> <UpRange19 /> <Price19VATExcluded /> <UpRange20 /> <Price20VATExcluded /> <UpRange21 /> <Price21VATExcluded /> <UpRange22 /> <Price22VATExcluded /> <UpRange23 /> <Price23VATExcluded /> <UpRange24 /> <Price24VATExcluded /> <UpRange25 /> <Price25VATExcluded /> <UpRange26 /> <Price26VATExcluded /> <UpRange27 /> <Price27VATExcluded /> <UpRange28 /> <Price28VATExcluded /> <UpRange29 /> <Price29VATExcluded /> <UpRange30 /> <Price30VATExcluded /> <UpRange31 /> <Price31VATExcluded /> <UpRange32 /> <Price32VATExcluded /> <UpRange33 /> <Price33VATExcluded /> <UpRange34 /> <Price34VATExcluded /> <UpRange35 /> <Price35VATExcluded /> <UpRange36 /> <Price36VATExcluded />
<CountryArray> <Country>
<Code /> </Country>
</ CountryArray >
float float float float float float float float float float float float float float float float float float float float float float float float float float float float float float float float float float float float float float float float float float float float float float float float float float
string 2
12th tier
12th Price VAT excluded 13th tier
13th Price VAT excluded 14th tier
14th Price VAT excluded 15th tier
15th Price VAT excluded 16th tier
16th Price VAT excluded 17th tier
17th Price VAT excluded 18th tier
18th Price VAT excluded 19th tier
19th Price VAT excluded 20th tier
20th Price VAT excluded 21th tier
21th Price VAT excluded 22th tier
22th Price VAT excluded 23th tier
23th Price VAT excluded 24th tier
24th Price VAT excluded 25th tier
25th Price VAT excluded 26th tier
26th Price VAT excluded 27th tier
27th Price VAT excluded 28th tier
28th Price VAT excluded 29th tier
29th Price VAT excluded 30th tier
30th Price VAT excluded 31th tier
31th Price VAT excluded 32th tier
32th Price VAT excluded 33th tier
33th Price VAT excluded 34th tier
34th Price VAT excluded 35th tier
35th Price VAT excluded 36th tier
36th Price VAT excluded
Country ISO 3166-2 code.
i.e: FR France, IT Italy, GB Great Britain, ES Spain...
                                                                                                                                                                                                                                                                                                                                                                                <GeoZone /> boolean
       Validity by country.
   true One or several countries false all countries
      O2) Shipping Type List
➢ XML Structure
<ShippingTypeList> <ShippingTypeIDs> <ShippingTypeID>
<OxID /> </ShippingTypeID>
</ShippingTypeIDs> </ShippingTypeList>
➢ Field Definitions, Types and Values Field     Type   Description
O3) Shipping Type API Methods
Instructions
         <OxID />
   integer
   Unique shipping type ID stored in OXATIS shipping type table.
   Must be greater than zero.
  ShippingTypeAdd ShippingTypeGetList
Adds a shipping type in OXATIS Shipping Type table. Returns a list of all shipping type OxID.
 ShippingTypeDelete
Deletes definetively a shipping type.
ShippingTypeGet
Returns all data in shipping type record.
ShippingTypeImport
Adds or Updates a shipping type in OXATIS Shipping Type table.
ShippingTypeUpdate
Updates an existing shipping type.
 Page 51 / 57

                                                                P.PROGRESS STATE
P1) Progress State
➢ XML Structure
<ProgressState> <Code /> <NameFR /> <NameEN /> <NameES /> <NameDE /> <NameIT /> <NameNL /> <NameCA /> <NamePT /> <CommentFR /> <CommentEN /> <CommentES /> <CommentDE /> <CommentIT /> <CommentNL /> <CommentCA /> <CommentPT /> <Publish /> <SendMail /> <UpdateOrders /> <CreateInvoice />
</ProgressState>
➢ Definitions, Types and Values Field     Type Length
Description
Unique ID stored in OXATIS progress state table. Progress state code.
Progress state name in French.
Progress state name in English.
Progress state name in Spanish. Progress state name in German. Progress state name in Italian. Progress state name in Dutch. Progress state name in Catalan. Progress state name in Portuguese.
Instructions
OWS API User Guide
Version 11.30 26 June 2022
                    <OxId />
<Code />
<NameFR />     string
Must be greater than zero.
integer string
16 100 100 100 100 100 100 100 100 4kb 4kb 4kb 4kb 4kb 4kb 4kb 4kb
                  <NameEN />
<NameES />
<NameDE />
<NameIT />
<NameNL />     string
string string string string
                                      <NameCA />
<NamePT />
<CommentFR />
<CommentEN />
<CommentES />     string <CommentDE/>     string <CommentIT />     string
string string string string
Comment
Comment
Comment
Comment
Comment
Comment
Comment
Comment
Publish this state of progress for the customer.
Send an email notifying the customer of the state of progress of their sales order.
Updates the state of progress of the sales order. Creates an invoice.
                                            <CommentNL />
<CommentCA />     string
in French.
in English.
in Spanish.
in German.
in Italian.
in Dutch.
in Catalan.
in Portuguese.
string
             <CommentPT />
<Publish />         boolean
<SendMail />
<UpdateOrders />     boolean
<CreateInvoice />
P2) Progress State List
➢ XML Structure
<ProgressStateList> <ProgressStateIDs> <ProgressStateID>
<OxID /> </ProgressStateID>
</ProgressStateIDs> </ProgressStateList>
string
           boolean boolean
                   ➢ Field Definitions, Types and Values Field         Type     Description
P3) Progress State API Methods
   <OxID />
   integer
   Unique sales order progress state ID stored in OXATIS sales order progress state table.
  ProgressStateGet ProgressStateGetList
Returns all data in Sales Order progress state record. Returns a list of all Sales Order progress state records.
 Page 52 / 57

 Q. TAX RATES
Q1) Tax Rate List
➢ XML Structure
➢ Field Definitions, Types and Values
OWS API User Guide
Version 11.30 26 June 2022
   <TaxRateList> <TaxRateIDs> <TaxRateID>
<Code /> <Name /> <Value /> </TaxRateID> </TaxRateIDs>
</TaxRateList>
                 Field
<Code /> <Name /> <Value />
Type Length
integer
string 50 float
Description
Unique ID tax code. Tax name.
Tax value.
                        ➢ API Method R.OPTIONS TYPE
R1) Option Type
➢ XML Structure
  TaxRateGetList
Returns a list of all taxes.
   <OptionTypes> <OxID /> <Name />
</OptionTypes>
   ➢ Field Definitions, Types and Values
   Field     Type   Length
Description
Unique ID stored in OXATIS Option types table. Option types name.
Instructions
Must be greater than zero.
               <OxId />
<Name />     string   50
R2) Option Type Detail
➢ XML Structure
integer
          <OptionTypeDetail> <OxID />
<NameCA /> <NameDE /> <NameEN /> <NameES /> <NameFR /> <NameIT /> <NameNL />
< NamePT /> <SystemName /> <OptionValueArray>
<OptionValue> <OxID /> <Code />
<NameCA /> <NameDE /> <NameEN /> <NameES /> <NameFR /> <NameIT /> <NameNL /> <NamePT />
</OptionValue> </OptionValueArray>
</OptionTypeDetail>
                          Page 53 / 57

                                                                                   OWS API User Guide
➢ Field Definitions, Types and Values
Version 11.30 26 June 2022
         Field
<OxId /> <NameCA /> <NameDE /> <NameEN /> <NameES /> <NameFR /> <NameIT /> <NameNL /> <NamePT /> <SystemName />
R3) Option Type List
➢ XML Structure
<OptionTypeList> <OxIDArray> <OxID /> </OxIDArray>
</OptionTypeList>
Type Length
integer
string 50 string 50 string 50 string 50 string 50 string 50 string 50 string 50 string 50
Description
Unique ID stored in OXATIS Option type table. Catalan option type name.
German option type name.
English option type name.
Spanish option value name. French option type name. Italian option type name. Dutch option type name. Portuguese option type name. Option type system name.
                                                                <OptionValueArray> <OptionValue>
<OxID /> <Code /> <NameCA /> <NameDE /> <NameEN /> <NameES /> <NameFR /> <NameIT /> <NameNL /> <NamePT />
</OptionValue>
< /Op tio nVa lue A r r a y >
                  Integer string string string string string string string string string
    10 50 50 50 50 50 50 50 50
    Unique ID stored in OXATIS Option value table. Unique option value code.
Catalan option value name.
German option value name.
English option value name. Spanish option value name. French option value name. Italian option value name. Dutch option value name. Portuguese option value name.
  ➢ Field Definitions, Types and Values
      Field     Type   Length
<OxId />     integer
R4) Option Type API Methods
S. OPTION VALUES
➢ XML Structure
<OptionValues> <OxID />
<Code / > <Name />
</OptionValues>
Description
Unique ID stored in OXATIS Option types table.
           OptionTypesGet OptionValuesGetDetail
Returns data in option type record. Returns all data in option values record.
 OptionTypesGetList
Returns a list of all option type OxID.
 ➢ Field Definitions, Types and Values
         Field
<OxId /> <Code /> <Name />
➢ API Method
Type     Length Description
integer       Unique ID stored in OXATIS Option values table.
Instructions
       Must be greater than zero.
     integer
string     70
10 Option value code. Option value name.
               OptionValuesGet
Returns data in option values record.
 Page 54 / 57

                            T. PAYMENT TYPE
T1) Payment Type
➢ XML Structure
<PaymentType> <OxID /> <NameFR /> <NameEN /> <NameES /> <NameDE /> <NameIT /> <NameNL /> <NameCA /> <NamePT />
</PaymentType>
OWS API User Guide
Version 11.30 26 June 2022
 ➢ Field Definitions, Types and Values
           Field
<OxId />
<NameFR />
<NameEN />
<NameES />
<NameDE />
<NameIT />     string   100 Italian payment type name.
Type Length Description Instructions
          integer string string string string
Unique ID stored in OXATIS Payment Type table. 100 French payment type name.
Must be greater than zero.
               100 English payment type name. 100 Spanish payment type name. 100 German payment type name.
                           <NameNL /> <NameCA /> <NamePT />
string string string
100 Dutch payment type name.
100 Catalan payment type name. 100 Portuguese payment type name.
                    T2) Payment Type List
➢ XML Structure
< PaymentTypeList> <PaymentTypeIDs> <PaymentTypeID>
<OxID /> </PaymentTypeID>
</PaymentTypeIDs> </PaymentTypeList>
 ➢ Field Definitions, Types and Values Field     Type   Description
T3) Payment Type API Methods
Instructions
        <OxID />
   integer
   Unique payment type ID stored in OXATIS payment type table.
   Must be greater than zero.
  PaymentTypeGet PaymentTypeGetList
Returns all data in payment type record. Returns a list of all payment type OxID.
 Page 55 / 57

 U.
OWS API User Guide
C# Web Service Call Sample
private String Token = @”Place your token here”; private String METHOD = @”Place method name here”; private String URL = @”place URL service here”;
private System.Xml.XmlDocument WebReq(String XML) {
HttpWebRequest wc = (HttpWebRequest)WebRequest.Create(URL); wc.ContentType = "application/x-www-form-urlencoded"; wc.Method = "POST"; wc.Headers.Add(HttpRequestHeader.AcceptLanguage,
Thread.CurrentThread.CurrentUICulture.Name); StringBuilder datas = new StringBuilder();
datas.Append("TOKEN=" + HttpUtility.UrlEncode(Token)+ "&"); datas.Append("METHOD=" + HttpUtility.UrlEncode(METHOD) + "&"); datas.Append("DATA=" + HttpUtility.UrlEncode(XML));
Byte[] l_Flux = Encoding.UTF8.GetBytes(datas.ToString());
wc.ContentLength = l_Flux.Length;
Stream l_StreamFluxData = wc.GetRequestStream(); l_StreamFluxData.Write(l_Flux, 0, l_Flux.Length);
System.Xml.XmlDocument xresp = new System.Xml.XmlDocument();
HttpWebResponse out_Response = (HttpWebResponse)wc.GetResponse(); try
{
Stream l_StreamResponce = out_Response.GetResponseStream();
StreamReader l_Reader = new StreamReader(l_StreamResponce, Encoding.UTF8); try
{
xresp.LoadXml(l_Reader.ReadToEnd()); }
finally
{
if (l_Reader != null) {
Version 11.30 26 June 2022
l_Reader.Close();
l_Reader.Dispose(); }
finally
{
out_Response.Close();
}
return xresp; }
} }
 Page 56 / 57

 OWS API User Guide
V.PHP Web Service Call Sample
<?php
/**
* WARNING: Your php CURL Extension must be enabled
*
* Call webservice and returns http response
*
*
*
* */
Version 11.30 26 June 2022
 * @param
 * strCallURL string webservice's URL
 * strMethod string The method to call
 * strBody string Your XML trame
 * bResult boolean success or error of the http request
 * @Constantes
 * CFG_APP_ID string Your application ID
 * CFG_TOKEN string Your access token
 * @return
 * if success returns string http response
 * if error returns boolean false
 DEFINE('CFG_APP_ID', '???????????');
 DEFINE('CFG_TOKEN', '?????????????????');
function CallWebService($strCallURL, $strMethod, $strBody, &$bResult){
$strURL = $strCallURL;
$strParams = 'Data=' . urlencode($strBody);
$strParams .= '&AppId=' . urlencode(CFG_APP_ID);
$strParams .= '&Token=' . urlencode(CFG_TOKEN);
$strParams .= '&Method=' . urlencode($strMethod);
$objCurl = curl_init();
curl_setopt($objCurl, CURLOPT_URL, $strURL);
curl_setopt($objCurl, CURLOPT_POST, 1);
curl_setopt($objCurl, CURLOPT_RETURNTRANSFER, 1);
curl_setopt($objCurl, CURLOPT_POSTFIELDS, $strParams);
curl_setopt($objCurl, CURLOPT_HTTPHEADER,
array("Content-Type: application/x-www-form-urlencoded", "Content-length: " . strlen($strParams)));
$strResponse = curl_exec($objCurl);
if ( !curl_errno($objCurl) ) {
} else {
$bResult = true;
$bResult = false;
}
$strResponse = 'An error occured: ' . curl_error($objCurl);
return $strResponse;
}
}
echo $strResponse;
?>
 //call function
 $strResponse =
 CallWebService('https://webservices.oxatis.com/WebServices/httpservices/productservices.aspx',
 'ProductGet',
 '<?xml version="1.0" encoding="utf-8"?> <Product xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
 xmlns:xsd="http://www.w3.org/2001/XMLSchema"><OxID>9999999</OxID></Product>', $bResult);
 if ( $bResult ) {
 header("Content-type: text/xml");
 