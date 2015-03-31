
fcViews.resourceMonth = ResourceMonthView;

function ResourceMonthView(element, calendar) {
	var t = this;
		
	// exports
	t.incrementDate = incrementDate;
	t.render = render;
    
	// imports
	BasicView.call(t, element, calendar, 'resourceMonth');
    ResourceEventMonthRenderer.call(t);
	t.calendar.options.dayRender = dayRender;

    function incrementDate(date, delta) {
		return date.clone().stripTime().add('months', delta).startOf('month');
	}
    
	function render(date) {
		t.intervalStart = date.clone().stripTime().startOf('month');
		t.intervalEnd = t.intervalStart.clone().add('months', 1);

		t.start = t.intervalStart.clone();
		t.start = t.skipHiddenDays(t.start); // move past the first week if no visible days
		t.start.startOf('week');
		t.start = t.skipHiddenDays(t.start); // move past the first invisible days of the week

		t.end = t.intervalEnd.clone();
		t.end = t.skipHiddenDays(t.end, -1, true); // move in from the last week if no visible days
		t.end.add((7 - t.end.weekday()) % 7, 'days'); // move to end of week if not already
		t.end = t.skipHiddenDays(t.end, -1, true); // move in from the last invisible days of the week

		var rowCnt = Math.ceil( // need to ceil in case there are hidden days
			t.end.diff(t.start, 'weeks', true) // returnfloat=true
		);
		if (t.opt('weekMode') == 'fixed') {
			t.end.add('weeks', 6 - rowCnt);
			rowCnt = 6;
		}

		t.title = calendar.formatDate(t.intervalStart, t.opt('titleFormat'));
 
		t.renderBasic(rowCnt, t.getCellsPerWeek(), true);
	}
    
    function dayRender(date, cell) {
        var mContainer = moment(date);
        var datePostfix =  mContainer.format("YYYYMMDD");
        var idString = "wxx" + datePostfix;
        var fcDayContent = $(cell).find('.fc-day-content');
        fcDayContent.children().empty();
        var wrapper = $('<div id="' + idString + '" class="fcDayContentWrapper"></div>');
        fcDayContent.children().append(wrapper);

        t.resources.forEach(function(resource, resourceIndex) {
            var resourceDiv = $('<div id="resourceContent' + datePostfix +"R"+ resourceIndex + '" class="fcDayContentResource"></div>');
            resourceDiv.css("width", Math.floor(100 / t.resources.length) + "%");
            resourceDiv.css("height", "80px");

            wrapper.append(resourceDiv);
        });
    }
}