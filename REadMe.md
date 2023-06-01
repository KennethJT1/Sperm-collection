### Requirements 
Here are some example endpoints you might consider implementing: 
* User Registration: POST /api/users/register - Create a new user account.✅
* User OTP-REQUEST: POST /api/users/OTP - User request for an otp.
* User Login: POST /api/users/login - Authenticate and obtain a user access token.✅
* User Profile: GET /api/users/profile - Retrieve the user's profile information.✅
* User Account Update: PUT /api/users/profile - Update the user's profile information.✅
* User Account Delete: DELETE /api/users/profile - Delete the user's profile information.✅
* User Account Password Reset: POST /api/users/password-reset - User's password reset.
* Donor Listing: GET /api/donors - Retrieve a list of available sperm donors.
* Donor Details: GET /api/donors/:id - Retrieve details of a specific sperm donor.
* Surrogate Listing: GET /api/surrogates - Retrieve a list of available surrogates.
* Surrogate Details: GET /api/surrogates/:id - Retrieve details of a specific surrogate.
* Donation Request: POST /api/donations/request - Create a new donation request.
* Donation Listing: GET /api/donations - Retrieve a list of donation requests.
* Donation Details: GET /api/donations/:id - Retrieve details of a specific donation request.
* Donation Acceptance: POST /api/donations/:id/accept - Accept a donation request.
* Donation Rejection: POST /api/donations/:id/reject - Reject a donation request.
* Surrogate Matching: POST /api/surrogates/:id/match - Match a surrogate with a sperm donor.
* Surrogate Pregnancy: POST /api/surrogates/:id/pregnancy - Update the pregnancy status of a surrogate.


### Model

1.User Collection:
_id: Unique identifier for the user
firstName: First name of the user
lastName: Last name of the user
email: Email address of the user
password: Encrypted password of the user
pictures: profile picture 
Other user-related fields as per your requirements
2. Donor and Surrogate Collection:
_id: Unique identifier for the client
userId: Foreign key referencing the associated user
profilePic: URL or file path to the client's profile picture
age: Age of the client
height: Height of the client
weight: Weight of the client
genotype: Genotype of the client
bloodGroups: List of blood groups
Other donor-related fields as per your requirements
3. Donation Request Collection:
_id: Unique identifier for the donation request
donorId: Foreign key referencing the associated donor
surrogateId: Foreign key referencing the associated surrogate
requestDate: Date when the donation request was made
status: Status of the donation request (e.g., pending, accepted, rejected)
Other donation request-related fields as per your requirements

