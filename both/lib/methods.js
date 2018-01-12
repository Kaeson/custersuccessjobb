Meteor.methods({
  deactivateJob: function(jobId, filled) {
    check(jobId, String);
    check(filled, Boolean);

    var job = Jobs.findOne({
      _id: jobId
    });
    if (!job)
      throw new Meteor.Error("Vi kunde tyvärr inte hitta det jobb du letade.");

    if (this.userId !== job.userId)
      throw new Meteor.Error("Du kan bara inaktivera det du själv lagt upp.");

    if (job.status !== "active")
      throw new Meteor.Error("Du kan bara inaktivera ett jobb som är aktivt");

    Jobs.update({
      _id: jobId
    }, {
      $set: {
        status: (filled ? "filled" : "inaktiv")
      }
    });
  },
  adminSetJobStatus: function(jobId, status) {
    check(jobId, String);
    check(status, String);

    var job = Jobs.findOne({
      _id: jobId
    });
    if (!job)
      throw new Meteor.Error("Vi kunde tyvärr inte hitta det jobb du letade.");

    if (!Roles.userIsInRole(this.userId, ['admin']))
      throw new Meteor.Error("Bara admins kan sätta jobbstatus");

    var setObject = {
      status: status
    };

    if (Meteor.isServer && status === "aktiv" && job.featured())
      setObject.featuredThrough = moment().add(30, "dagar").toDate();

    Jobs.update({
      _id: jobId
    }, {
      $set: setObject
    });

  },
  adminSetProfileStatus: function(profileId, status) {
    check(profileId, String);
    check(status, String);

    var job = Profiles.findOne({
      _id: profileId
    });
    if (!job)
      throw new Meteor.Error("Vi kunde inte hitta profilen");

    if (!Roles.userIsInRole(this.userId, ['admin']))
      throw new Meteor.Error("Bara admins kan sätta profilstatus");

    var setObject = {
      status: status
    };


    Profiles.update({
      _id: profileId
    }, {
      $set: setObject
    });

  },
  createFeaturedJobCharge: function(tokenId, jobId) {
    check(tokenId, String);
    check(jobId, String);

    var job = Jobs.findOne({ _id: jobId });
    if (!job)
      throw new Meteor.Error("Vi kunde tyvärr inte hitta jobbet du letade.");

    if (job.userId !== this.userId)
      throw new Meteor.Error("Du kan bara betala för det jobb du själv lagt upp.");


    if (Meteor.isServer) {
      var result = Stripe.charges.create({
        source: tokenId,
        amount: 10000,
        currency: "usd",
        description: "Customer Success - Utvalda jobb - 30 Dagar"
      });

      if (result && (result.status === "succeeded" || result.status === "paid")) { //'paid' status is not in stripe docs, but is occuring - see https://github.com/nate-strauser/wework/issues/108
        Jobs.update({ _id: job._id }, {
          $set: {
            featuredThrough: moment().add(30, "dagar").toDate()
          },
          $push: {
            featuredChargeHistory: result.id
          }
        });
      } else {
        throw new Meteor.Error("Payment Failed!", "Stripe result not as expected", JSON.stringify(result));
      }
    } else {
      Jobs.update({
        _id: jobId
      }, {
        $set: {
          featuredThrough: moment().add(30, "dagar").toDate()
        }
      });
    }
  }
});
