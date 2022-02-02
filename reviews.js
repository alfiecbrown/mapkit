/* https://github.com/peledies/google-places */
(function ($) {
  $.googlePlaces = function (element, options) {
    var defaults = {
      placeId: "ChIJN1t_tDeuEmsRUsoyG83frY4", // placeId provided by google api documentation
      render: ["reviews"],
      min_rating: 0,
      max_rows: 0,
      rotateTime: false,
      max_lines: 0
    };

    var plugin = this;

    plugin.settings = {};

    var $element = $(element),
      element = element;

    plugin.init = function () {
      plugin.settings = $.extend({}, defaults, options);
      $element.html("<div id='map-plug' style='display: none!important;'></div>"); // create a plug for google to load data into
      initialize_place(function (place) {
        plugin.place_data = place;
        // render specified sections
        if (plugin.settings.render.indexOf("reviews") > -1) {
          renderReviews(plugin.place_data.reviews);
          if (!!plugin.settings.rotateTime) {
            initRotation();
          }
        }
      });
    };

    var initialize_place = function (c) {
      var map = new google.maps.Map(document.getElementById("map-plug"));

      var request = {
        placeId: plugin.settings.placeId,
      };

      var service = new google.maps.places.PlacesService(map);

      service.getDetails(request, function (place, status) {
        if (status == google.maps.places.PlacesServiceStatus.OK) {
          c(place);
        }
      });
    };

    var sort_by_date = function (ray) {
      ray.sort(function (a, b) {
        var keyA = new Date(a.time),
          keyB = new Date(b.time);
        // Compare the 2 dates
        if (keyA < keyB) return -1;
        if (keyA > keyB) return 1;
        return 0;
      });
      return ray;
    };

    var filter_minimum_rating = function (reviews) {
      for (var i = reviews.length - 1; i >= 0; i--) {
        if (reviews[i].rating < plugin.settings.min_rating) {
          reviews.splice(i, 1);
        }
      }
      return reviews;
    };

    var renderReviews = function (reviews) {
      reviews = sort_by_date(reviews);
      reviews = filter_minimum_rating(reviews);
      var html = "";
      var row_count =
        plugin.settings.max_rows > 0
          ? plugin.settings.max_rows - 1
          : reviews.length - 1;
      // make sure the row_count is not greater than available records
      row_count =
        row_count > reviews.length - 1 ? reviews.length - 1 : row_count;
      for (var i = row_count; i >= 0; i--) {
        var stars = renderStars(reviews[i].rating);
        var date = convertTime(reviews[i].time);
        html =
          html +
          "<div class='review-wrapper'><div class='review-item'><div class='review-meta'><span class='review-author'>" +
          reviews[i].author_name +
          "</span>"+ stars +"</span><span class='review-date'>" +
          date +
          "</span></div><p class='review-text'>" +
          reviews[i].text +
          "</p></div></div>";
      }
      $element.append(html);

      // clamp
      const reviewEls = Array.from(document.querySelectorAll('.review-item'));
      reviewEls.forEach((reviewEl, index)=>{
          Array.from(reviewEl.children).forEach((child,index) => {
            if(child.classList.contains('review-text')) {
                $clamp(child, {clamp: plugin.settings.max_lines})
            }
          })
      })

      // requires slick, make sure to include!
      $element.slick({
          slidesToShow: plugin.settings.show
      });
    };

    var initRotation = function () {
      var $reviewEls = $element.children(".review-item");
      var currentIdx = $reviewEls.length > 0 ? 0 : false;
      $reviewEls.hide();
      if (currentIdx !== false) {
        $($reviewEls[currentIdx]).show();
        setInterval(function () {
          if (++currentIdx >= $reviewEls.length) {
            currentIdx = 0;
          }
          $reviewEls.hide();
          $($reviewEls[currentIdx]).fadeIn("slow");
        }, plugin.settings.rotateTime);
      }
    };

    var renderStars = function (rating) {
      var stars = "<div class='review-stars'><ul class='star-wrapper'>";

      // fill in gold stars
      for (var i = 0; i < rating; i++) {
        stars = stars + "<li class='star-item'><div class='star'>"+'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 14 14"><path fill="none" d="M6.826 10.743l-3.28 1.724a.5.5 0 0 1-.725-.528l.627-3.65a.5.5 0 0 0-.144-.443L.65 5.26a.5.5 0 0 1 .277-.853l3.666-.533a.5.5 0 0 0 .377-.273L6.61.279a.5.5 0 0 1 .896 0L9.147 3.6a.5.5 0 0 0 .376.273l3.666.533a.5.5 0 0 1 .277.853l-2.653 2.586a.5.5 0 0 0-.144.442l.627 3.651a.5.5 0 0 1-.726.528l-3.279-1.724a.5.5 0 0 0-.465 0z"></path></svg>'+"</div></li>";
      }

      // fill in empty stars
      if (rating < 5) {
        for (var i = 0; i < 5 - rating; i++) {
          stars = stars + "<li><i class='star inactive'></i></li>";
        }
      }
      stars = stars + "</ul></div>";
      return stars;
    };

    var convertTime = function (UNIX_timestamp) {
      var a = new Date(UNIX_timestamp * 1000);
      var months = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      var time =
        months[a.getMonth()] + " " + a.getDate() + ", " + a.getFullYear();
      return time;
    };

    plugin.init();
  };

  $.fn.googlePlaces = function (options) {
    return this.each(function () {
      if (undefined == $(this).data("googlePlaces")) {
        var plugin = new $.googlePlaces(this, options);
        $(this).data("googlePlaces", plugin);
      }
    });
  };
})(jQuery);
