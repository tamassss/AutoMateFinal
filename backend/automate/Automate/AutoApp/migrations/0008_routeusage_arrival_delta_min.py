from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("AutoApp", "0007_fueling_gas_station_set_null"),
    ]

    operations = [
        migrations.AddField(
            model_name="routeusage",
            name="arrival_delta_min",
            field=models.IntegerField(blank=True, null=True),
        ),
    ]
