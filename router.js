Router.configure({
    layoutTemplate: 'layout',
    loadingTemplate: 'loading',
    yieldTemplates: {
        header: {
            to: 'header'
        },
        footer: {
            to: 'footer'
        }
    },
    progressSpinner: false,
    progressDelay: 250,
    title: "Customer Success - Jobb inom customer success management"
});


Router.map(function() {
    this.route('home', {
        path: '/',
        layoutTemplate: 'layoutNoContainer',
        data: function() {
            return {
                jobs: Jobs.find({
                    featuredThrough: {
                        $exists: false
                    },
                    status: "active"
                }, {
                    sort: {
                        createdAt: -1
                    },
                    limit: 10
                }),
                featuredJobs: Jobs.find({
                    featuredThrough: {
                        $gte: new Date()
                    },
                    status: "active"
                }, {
                    sort: {
                        featuredThrough: -1
                    }
                }),
                profiles: Profiles.find({}, {
                    sort: {
                        availableForHire: -1,
                        randomSorter: 1
                    },
                    limit: 8
                }),
                profile: Profiles.findOne({
                    userId: Meteor.userId()
                })
            };
        },
        subscriptions: function() {
            return [subs.subscribe('homeJobs'), subs.subscribe('featuredJobs'), Meteor.subscribe('homeDevelopers'), subs.subscribe('developerCount'), subs.subscribe('jobCount')];
        }
    });

    this.route('jobs', {
        path: '/jobs',
        title: "Customer Success - Alla Jobb"
    });

    this.route('myJobs', {
        path: '/myjobs',
        title: "Customer Success - Mina Jobb",
        data: function() {
            return {
                jobs: Jobs.find({
                    userId: Meteor.userId()
                }, {
                    sort: {
                        createdAt: -1
                    }
                })
            };
        },
        waitOn: function() {
            return subs.subscribe('my_jobs');
        }
    });

    this.route('job', {
        path: '/jobs/:_id/:slug?',
        title: function() {
            if (this.data())
                return "Customer Success - " + this.data().title;
        },
        data: function() {
            return Jobs.findOne({
                _id: this.params._id
            });
        },
        waitOn: function() {
            return subs.subscribe("job", this.params._id);
        },
        onBeforeAction: function() {
            var expectedSlug = this.data().slug();
            if (this.params.slug !== expectedSlug) {
                this.redirect("job", {
                    _id: this.params._id,
                    slug: expectedSlug
                });
            } else {
                this.next();
            }
        }
    });

    this.route('jobNew', {
        path: '/job',
        title: "Customer Success - Lägg in ett jobb"
    });

    this.route('jobEdit', {
        path: '/jobs/:_id/:slug/edit',
        title: "Customer Success - Redigera jobb",
        data: function() {
            return {
                job: Jobs.findOne({
                    _id: this.params._id
                })
            };
        },
        waitOn: function() {
            return subs.subscribe("job", this.params._id);
        }
    });

    this.route('profiles', {
        path: '/profiles',
        title: "Customer Success - Alla Customer Success Managers",
        subscriptions: function() {
            return subs.subscribe('developerUsers');
        }
    });

    this.route('profile', {
        path: '/profiles/:_id/:slug?',
        title: function() {
            if (this.data())
                return "Customer Success - " + this.data().displayName() + " - " + this.data().title;
        },
        data: function() {
            return Profiles.findOne({
                _id: this.params._id
            });
        },
        waitOn: function() {
            return subs.subscribe('profile', this.params._id);
        },
        onBeforeAction: function() {
            var expectedSlug = this.data().slug();
            if (this.params.slug !== expectedSlug) {
                this.redirect("profile", {
                    _id: this.params._id,
                    slug: expectedSlug
                });
            } else {
                this.next();
            }
        }
    });

    this.route('profileNew', {
        path: '/profile',
        title: "Customer Success - Skapa en CSM profil",
        onBeforeAction: function() {
            if (Meteor.user().isDeveloper) {
                Router.go('profile', Profiles.findOne({
                    userId: Meteor.userId()
                }));
            } else {
                this.next();
            }
        }
    });

    this.route('profileEdit', {
        path: '/profiles/:_id/:slug/edit',
        title: "Customer Success - Redigera min profil",
        data: function() {
            return {
                profile: Profiles.findOne({
                    _id: this.params._id
                })
            };
        },
        waitOn: function() {
            return subs.subscribe('profile', this.params._id);
        }
    });

    //legacy url redirects
    this.route('experts', function() {
        this.redirect("profiles");
    });
    this.route('experts/:_id', function() {
        this.redirect("profile", {
            _id: this.params._id
        });
    });
});

Router.plugin('ensureSignedIn', {
    only: ['profileEdit', 'profileNew', 'jobEdit', 'jobNew']
});


Router.onBeforeAction(function() {
    loadUploadcare();
    this.next();
}, {
    only: ['profileEdit', 'profileNew', 'jobEdit', 'jobNew']
});

Router.plugin('dataNotFound', {
    notFoundTemplate: 'notFound'
});
