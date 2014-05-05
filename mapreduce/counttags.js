db.cdnjs.mapReduce(
	function() {
		if (!this.keywords) {
			return;
		}
		for (index in this.keywords) {
			emit(this.keywords[index], 1);
		}
	}, function(previous, current) {
		var count = 0;
		for (index in current) {
			count += current[index];
		}
		return count;
	}, {
		out: 'tags'
	}
);
